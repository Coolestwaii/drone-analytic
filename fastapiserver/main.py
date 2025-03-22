from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from zipfile import ZipFile
import rasterio
from pyproj import Transformer
from PIL import Image
import os
import json
from dotenv import load_dotenv

load_dotenv()  # Loads the .env file

app = FastAPI()


LOCAL_STORAGE_URL = os.getenv("LOCAL_STORAGE_URL", "/home/duxmazter/droneuploads")  # Fallback default

# Utility: Get bounds and center in decimal degrees
def get_bounds_and_center(filepath):
    try:
        with rasterio.open(filepath) as dataset:
            bounds = dataset.bounds
            crs = dataset.crs.to_string()  # Get CRS of the GeoTIFF

        transformer = Transformer.from_crs(crs, "EPSG:4326", always_xy=True)

        # Convert bounds to decimal degrees
        top_left_latlon = transformer.transform(bounds.left, bounds.top)
        bottom_right_latlon = transformer.transform(bounds.right, bounds.bottom)

        # Calculate the center point
        center_x = (bounds.left + bounds.right) / 2
        center_y = (bounds.top + bounds.bottom) / 2
        center_latlon = transformer.transform(center_x, center_y)

        return {
            "top_left": {"lat": top_left_latlon[1], "lon": top_left_latlon[0]},
            "bottom_right": {"lat": bottom_right_latlon[1], "lon": bottom_right_latlon[0]},
            "center": {"lat": center_latlon[1], "lon": center_latlon[0]},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading GeoTIFF bounds: {e}")


# Utility: Convert GeoTIFF to PNG
def convert_tif_to_png(input_tif, output_png):
    try:
        with Image.open(input_tif) as img:
            if img.mode in ("RGBA", "LA"):
                img.save(output_png, "PNG")
            else:
                img = img.convert("RGBA")
                datas = img.getdata()
                new_data = []
                for item in datas:
                    if item[:3] == (255, 255, 255):  # White pixels
                        new_data.append((255, 255, 255, 0))  # Transparent
                    else:
                        new_data.append(item)
                img.putdata(new_data)
                img.save(output_png, "PNG")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error converting GeoTIFF to PNG: {e}")


# API Endpoint: Full Processing Pipeline
@app.post("/projects/{project_id}/process/")
async def process_project_folder(project_id: str):
    try:
        # Define paths
        project_folder = os.path.join(LOCAL_STORAGE_URL, "projects", project_id)
        zip_file_path = os.path.join(project_folder, "all.zip")

        # Debug: Print paths
        print(f"Project folder path: {project_folder}")
        print(f"ZIP file path: {zip_file_path}")

        # Check if the zip file exists
        if not os.path.exists(zip_file_path):
            print(f"ZIP file not found at path: {zip_file_path}")
            raise HTTPException(status_code=404, detail="all.zip file not found in project folder")

        # Unzip the file
        with ZipFile(zip_file_path, "r") as zip_ref:
            zip_ref.extractall(project_folder)
            print(f"Unzipped files to: {project_folder}")

        # Locate the GeoTIFF file
        orthophoto_tif = os.path.join(project_folder, "odm_orthophoto", "odm_orthophoto.tif")
        if not os.path.exists(orthophoto_tif):
            raise HTTPException(status_code=404, detail="GeoTIFF file odm_orthophoto.tif not found in odm_orthophoto/")

        # Convert to PNG
        output_png = os.path.join(project_folder, "odm_orthophoto", "odm_orthophoto.png")
        print(f"Converting GeoTIFF to PNG at: {output_png}")
        convert_tif_to_png(orthophoto_tif, output_png)

        # Get bounds and center in decimal degrees
        bounds_data = get_bounds_and_center(orthophoto_tif)
        print(f"Bounds - Top-Left: {bounds_data['top_left']}, Bottom-Right: {bounds_data['bottom_right']}, Center: {bounds_data['center']}")

        # Save bounds and center to JSON file
        bounds_json_path = os.path.join(project_folder, "bounds.json")
        with open(bounds_json_path, "w") as json_file:
            json.dump(bounds_data, json_file, indent=4)
            print(f"Bounds data saved to JSON file at: {bounds_json_path}")

        return JSONResponse({
            "message": "Unzipped and processed successfully",
            "bounds": bounds_data,
            "png_path": output_png,
            "bounds_json_path": bounds_json_path,
        })
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/{project_id}/bounds")
async def get_project_bounds(project_id: str):
    try:
        # Define path to `bounds.json`
        project_folder = os.path.join(LOCAL_STORAGE_URL, "projects", project_id)
        bounds_file_path = os.path.join(project_folder, "bounds.json")

        # Check if the file exists
        if not os.path.exists(bounds_file_path):
            raise HTTPException(status_code=404, detail="bounds.json not found in the project folder")

        # Load and return the content of `bounds.json`
        with open(bounds_file_path, "r") as file:
            bounds_data = json.load(file)

        return JSONResponse(content=bounds_data, status_code=200)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading bounds.json: {e}")
    
@app.get("/check-storage")
async def check_storage(subpath: str = Query(default="", description="Optional subpath inside LOCAL_STORAGE_URL")):
    try:
        # Build full path from base and subpath
        full_path = os.path.join(LOCAL_STORAGE_URL, subpath)

        # Normalize path to avoid traversal issues
        full_path = os.path.abspath(full_path)

        if not full_path.startswith(os.path.abspath(LOCAL_STORAGE_URL)):
            raise HTTPException(status_code=400, detail="Subpath is outside the allowed storage directory.")

        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail=f"Path does not exist: {full_path}")
        if not os.path.isdir(full_path):
            raise HTTPException(status_code=400, detail=f"Path is not a directory: {full_path}")

        files = os.listdir(full_path)
        return {
            "message": f"Path is accessible.",
            "full_path": full_path,
            "files": files
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))