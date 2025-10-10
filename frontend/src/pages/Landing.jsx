import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import { Link } from "react-router-dom";
import {
  AcademicCapIcon,
  UserGroupIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      <Navbar />

      {/* Hero Section */}
      <motion.header
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.8 }}
        variants={fadeUp}
        className="flex-1 flex flex-col items-center justify-center text-center py-20 px-6 md:px-12"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500">
          Trade Skills. Grow Together.
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg md:text-xl max-w-2xl">
          A community-driven platform to learn, teach, and exchange skills
          without limits.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/register">
            <Button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
              Get Started
            </Button>
          </Link>
          <Link to="/explore">
            <Button className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
              Browse Skills
            </Button>
          </Link>
        </div>
      </motion.header>

      {/* Features Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.8, staggerChildren: 0.2 }}
        className="px-6 md:px-12 py-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {[
          {
            icon: (
              <AcademicCapIcon className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
            ),
            title: "Learn New Skills",
            desc: "Connect with mentors and learn hands-on from skilled people.",
          },
          {
            icon: (
              <UserGroupIcon className="w-12 h-12 text-purple-600 dark:text-purple-400 mb-4" />
            ),
            title: "Share Your Knowledge",
            desc: "Teach your expertise, help others grow, and gain reputation.",
          },
          {
            icon: (
              <ArrowsRightLeftIcon className="w-12 h-12 text-green-600 dark:text-green-400 mb-4" />
            ),
            title: "Exchange Skills",
            desc: "Trade skills with peers and build meaningful connections.",
          },
        ].map((feature, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            transition={{ duration: 0.6, delay: i * 0.2 }}
            className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            {feature.icon}
            <h2 className="font-bold text-2xl mb-2">{feature.title}</h2>
            <p className="text-gray-700 dark:text-gray-300">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.8, staggerChildren: 0.2 }}
        variants={fadeUp}
        className="px-6 md:px-12 py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center"
      >
        <h2 className="text-3xl font-bold mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "1. Create Profile",
              desc: "Sign up and showcase the skills you can teach or want to learn.",
            },
            {
              title: "2. Browse Skills",
              desc: "Explore the marketplace and find skills that interest you.",
            },
            {
              title: "3. Exchange & Grow",
              desc: "Request, connect, and start learning or teaching right away.",
            },
          ].map((step, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="p-6 rounded-xl bg-white/10 backdrop-blur-md"
            >
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.footer
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        variants={fadeUp}
        className="py-16 text-center px-6"
      >
        <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          Ready to start your skill journey?
        </h2>
        <Link to="/register">
          <Button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            Join Now
          </Button>
        </Link>
      </motion.footer>
    </div>
  );
};

export default Landing;
