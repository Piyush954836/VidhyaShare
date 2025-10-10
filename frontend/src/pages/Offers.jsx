import { useState, useMemo } from "react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import useSkillStore from "../store/skillStore";
import { Link } from "react-router-dom";

// Fallback sample requests
const sampleRequests = [
  {
    id: 1,
    skill: "React Basics",
    requester: "Alice",
    status: "pending",
  },
  {
    id: 2,
    skill: "Guitar Lessons",
    requester: "Bob",
    status: "accepted",
  },
  {
    id: 3,
    skill: "Digital Marketing",
    requester: "Carol",
    status: "rejected",
  },
];

const Offers = () => {
  const [requests, setRequests] = useState(sampleRequests);

  const handleAction = (id, action) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: action === "accept" ? "accepted" : "rejected" }
          : r
      )
    );
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100",
    accepted: "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100",
    rejected: "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100",
  };

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      const order = { pending: 0, accepted: 1, rejected: 2 };
      return order[a.status] - order[b.status];
    });
  }, [requests]);

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <div className="px-4 md:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-white">
            Incoming Offers
          </h1>

          {sortedRequests.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
              <h3 className="text-xl font-semibold mb-2">No offers yet</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Once users request your skills, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {sortedRequests.map((req) => (
                <Card
                  key={req.id}
                  title={req.skill}
                  subtitle={`Requested by ${req.requester}`}
                  className="hover:-translate-y-1 transition-transform"
                >
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${statusColors[req.status]}`}
                  >
                    {req.status.toUpperCase()}
                  </span>

                  <div className="mt-4 flex flex-wrap gap-2 justify-end">
                    {req.status === "pending" && (
                      <>
                        <Button
                          onClick={() => handleAction(req.id, "accept")}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleAction(req.id, "reject")}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    <Link
                      to={`/chat/${req.requester}`}
                      className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      Chat
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Offers;
