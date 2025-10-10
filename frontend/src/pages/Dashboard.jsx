import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Card from "../components/ui/Card";

const Dashboard = () => {
  const stats = [
    { title: "Skills Offered", value: 12 },
    { title: "Skills Traded", value: 5 },
    { title: "Pending Requests", value: 3 },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <div className="p-6 md:p-8 flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8 transition-colors duration-500">
            Dashboard
          </h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {stats.map((s) => (
              <Card
                key={s.title}
                title={s.title}
                className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <p className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {s.value}
                </p>
              </Card>
            ))}
          </div>

          {/* Future sections can go here */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
