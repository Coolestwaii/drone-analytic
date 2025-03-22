import { FiTrash } from "react-icons/fi";

const DeleteBuildingButton = ({ projectId }: { projectId: string }) => {
    const handleDeleteBuilding = async () => {
        if (!projectId) {
          alert("Invalid Project ID");
          return;
        }
      
        const confirmDelete = window.confirm(
          "Are you sure you want to delete the building footprint? This action cannot be undone."
        );
      
        if (!confirmDelete) return;
      
        try {
          const response = await fetch(`/api/projects/${projectId}/building`, {
            method: "DELETE",
          });
      
          if (response.status === 404) {
            alert("Building footprint not found.");
            return;
          }
      
          if (!response.ok) {
            throw new Error(`Failed to delete building footprint. Status: ${response.status}`);
          }
      
          alert("Building footprint deleted successfully.");
          window.location.reload(); // Reload the page to reflect deletion
        } catch (error) {
          console.error("Error deleting building footprint:", error);
          alert("Error deleting building footprint. Please try again.");
        }
      };
      

  return (
    <button
      onClick={handleDeleteBuilding}
      className="bg-red-800 justify-center mt-4 text-white w-full py-2 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 flex items-center gap-2"
    >
      <FiTrash className="text-lg" />
      Delete Building
    </button>
  );
};

export default DeleteBuildingButton;  // ✅ Ensure it's exported as default
