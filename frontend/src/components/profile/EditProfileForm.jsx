import { useRef } from "react";
import Button from "../ui/Button"; 

const EditProfileForm = ({
  user,
  name,
  setName,
  bio,
  setBio,
  profilePic,
  setProfilePic,
  uploading,
  handleSave,
  onCancel,
  fileInputRef // Passed from parent or created here if logic allows
}) => {
  // Note: fileInputRef needs to be passed down or handled via callback in parent to maintain exact logic
  
  return (
    <form
      onSubmit={handleSave}
      className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg space-y-6 max-w-2xl mx-auto"
    >
      <div className="flex flex-col items-center gap-4">
        <img
          src={profilePic || `https://i.pravatar.cc/150?u=${user.id}`}
          alt="Profile preview"
          className="w-32 h-32 rounded-full border-4 border-indigo-300 dark:border-indigo-500 object-cover"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) =>
            e.target.files[0] &&
            setProfilePic(URL.createObjectURL(e.target.files[0]))
          }
          className="block w-full max-w-xs text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-gray-200 dark:file:bg-gray-600"
        />
      </div>
      <div>
        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
      <div>
        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows="3"
          className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
        ></textarea>
      </div>
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          disabled={uploading}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-purple-500 hover:to-indigo-500"
        >
          {uploading ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 dark:bg-gray-600 text-black dark:text-white"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default EditProfileForm;