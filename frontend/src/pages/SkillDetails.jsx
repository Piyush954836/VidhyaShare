import { useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import useSkillStore from "../store/skillStore";

// Dummy skill data for now
const seedSkills = [
  {
    id: "1",
    title: "React Basics",
    description:
      "Learn React from scratch. Covers components, state, props, hooks, and routing.",
    owner: "Alice",
    category: "Programming",
    rating: 4.8,
    reviews: [
      { reviewer: "Bob", comment: "Very helpful!", stars: 5 },
      { reviewer: "Carol", comment: "Great explanations.", stars: 4 },
    ],
  },
  {
    id: "2",
    title: "Guitar Lessons",
    description: "Learn guitar chords, strumming patterns, and song playthroughs.",
    owner: "Bob",
    category: "Music",
    rating: 4.5,
    reviews: [
      { reviewer: "Alice", comment: "Awesome lessons!", stars: 5 },
      { reviewer: "Carol", comment: "Good pace.", stars: 4 },
    ],
  },
];

const SkillDetails = () => {
  const { id } = useParams();
  const skills = useSkillStore((s) => s.skills.length ? s.skills : seedSkills);
  const addSkill = useSkillStore((s) => s.addSkill);

  const skill = skills.find((s) => s.id === id) || seedSkills[0];

  const [openModal, setOpenModal] = useState(false);

  const handleRequest = () => setOpenModal(true);
  const confirmRequest = () => {
    addSkill({ ...skill, requested: true });
    setOpenModal(false);
    alert(`Skill request sent for ${skill.title}`);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 md:p-10 flex-1">
          <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-6 md:p-10 rounded-3xl shadow-lg text-white transition-all">
            <h1 className="text-3xl md:text-4xl font-bold">{skill.title}</h1>
            <p className="mt-2 text-white/90">{skill.description}</p>
            <p className="mt-3 font-semibold">
              Category: <span className="bg-white/20 px-2 py-1 rounded">{skill.category}</span>
            </p>
            <p className="mt-1 font-semibold">
              Offered by: <span className="underline cursor-pointer">{skill.owner}</span>
            </p>
            <p className="mt-1 font-semibold">Rating: {skill.rating} ⭐</p>

            {!skill.requested && (
              <div className="mt-6">
                <Button onClick={handleRequest} className="bg-white text-blue-600 hover:text-white hover:bg-blue-600 transition">
                  Request Skill
                </Button>
              </div>
            )}
            {skill.requested && (
              <p className="mt-6 font-bold text-green-200">Request Sent ✅</p>
            )}
          </div>

          {/* Reviews */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold mb-4">Reviews</h2>
            {skill.reviews.length === 0 ? (
              <p className="text-gray-700 dark:text-gray-300">No reviews yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {skill.reviews.map((r, i) => (
                  <Card key={i} title={r.reviewer} className="bg-white dark:bg-gray-900">
                    <p className="text-gray-700 dark:text-gray-300">{r.comment}</p>
                    <p className="mt-2 font-semibold">Rating: {r.stars} ⭐</p>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Request Modal */}
      <Modal isOpen={openModal} onClose={() => setOpenModal(false)} title="Confirm Skill Request">
        <p>
          Do you want to request: <strong>{skill.title}</strong> from <strong>{skill.owner}</strong>?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={confirmRequest}>Confirm</Button>
        </div>
      </Modal>
    </div>
  );
};

export default SkillDetails;
