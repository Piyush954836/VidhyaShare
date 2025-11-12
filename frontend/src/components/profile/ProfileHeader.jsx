import Button from "../ui/Button"; 

const ProfileHeader = ({ user, name, bio, profilePic, onEdit }) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
      <img
        key={profilePic}
        src={profilePic || `https://i.pravatar.cc/150?u=${user.id}`}
        alt={name || "User"}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://i.pravatar.cc/150?u=${user.id}`;
        }}
        className="w-32 h-32 rounded-full object-cover border-4 border-indigo-300 dark:border-indigo-500"
      />
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
          {name || "User"}
        </h2>
        {bio && (
          <p className="mt-2 text-gray-700 dark:text-gray-200 max-w-xl mx-auto md:mx-0">
            {bio}
          </p>
        )}
        <div className="mt-6">
          <Button
            onClick={onEdit}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-purple-500 hover:to-indigo-500"
          >
            Edit Profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;