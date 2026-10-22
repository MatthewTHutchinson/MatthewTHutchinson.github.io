export const siteConfig = {
base: "MatthewTHutchinson.github.io",
name: "Matthew Hutchinson",
title: "Mechanical Engineer | Robotics and AI",
description:
"Portfolio of Matthew Hutchinson, a UCLA mechanical engineering graduate building robotics software and evaluating machine learning systems.",
accentColor: "#1d4ed8",
social: {
email: "matthewthutchinson1@gmail.com",
linkedin: "https://www.linkedin.com/in/matt-hutch/",
twitter: "",
github: "https://github.com/MatthewTHutchinson",
},
aboutMe:
"I'm a UCLA mechanical engineering graduate building robotics software and evaluating machine learning systems. My work spans robot motion planning and control, computer vision, and LLM evaluation. I'm interested in how foundation models and reinforcement learning can help robots understand and act in the physical world, and in the testing and integration needed to make those systems useful.",
skills: [
"Python",
"C++",
"PyTorch",
"OpenCV",
"ROS 2",
"Reinforcement Learning",
"Deep Learning",
"Natural Language Processing",
"Model Evaluation",
"Linux",
"Git",
"Docker",
"GCP Compute Engine",
"Control Systems",
"MATLAB",
"Hardware Integration",
"SolidWorks",
"GD&T",
"FEA",
"Additive Manufacturing",
"Laser Cutting",
],
projects: [
{
name: "Tripteron",
description:
"Built the kinematic model, continuous path checks, and browser control interface for a parallel robot, translating XYZ targets into coordinated carriage motion.",
link: "/projects/tripteron",
skills: ["Python", "Kinematics", "Motion Planning", "CAD Geometry", "Klipper"],
category: "engineering",
},
{
name: "Hexapod",
description:
"Developed control, diagnostics, and operator tools for RoMeLa's TOCATL hexapod, connecting motor telemetry, calibration, and coordinated behavior previews.",
link: "/projects/hexapod",
skills: ["Python", "ROS 2", "CAN Bus", "Control Systems", "Telemetry"],
category: "engineering",
},
{
name: "MapLaser",
description:
"Built a Python pipeline that turns geographic data into layered SVG maps, with configurable crops, road widths, and geometry processing for laser fabrication.",
link: "/projects/laser-cut-maps",
skills: ["Python", "Geospatial Processing", "OpenStreetMap", "SVG", "Laser Cutting"],
category: "engineering",
},
{
name: "Autonomous Rover",
description:
"Built a ROS 2/OpenCV autonomy stack with line following, recovery behaviors, and encoder-based wheel control; tested how sensing latency affected course completion.",
link: "/projects/autonomous-rover",
skills: ["Python", "C++", "ROS 2", "OpenCV", "PID Control", "Raspberry Pi", "Arduino"],
category: "engineering",
},
{
name: "Robotic Arm for Automated Fiber Placement",
description:
"Developed an impedance controller in PyDrake for automated composite fiber placement, focusing on accurate force control and dynamic interaction with mold surfaces.",
link: "/projects/robotic-arm-afp",
skills: ["Python", "PyDrake", "Impedance Control", "Contact Modeling", "UR5e"],
category: "engineering",
},
{
name: "Knowledge Editing of Large Language Models",
description:
"Compared ROME, MEMIT, and IKE on GPT-2 XL using EasyEdit, external benchmarks, and 225 diagnostic probes to test whether factual rewrites produce consistent follow-up answers.",
link: "/projects/knowledge-editing",
skills: ["Python", "PyTorch", "EasyEdit", "NLP", "RAG", "Model Evaluation", "GCP Compute Engine"],
category: "research",
},
{
name: "Motorcycle Maintenance & Modifications",
description:
"Hands-on work on my Suzuki SV650: performed valve inspections, coolant flush, exhaust upgrade, oil changes.",
link: "/projects/motorcycle",
skills: ["Mechanical Systems", "Diagnostics", "Engine Work", "Tools & Torque Specs"],
category: "fabrication",
},
{
name: "Laser-Cut Japanese Pagoda",
description:
"A lantern inspired by Japanese pagoda architecture, made from laser-cut wood joinery and surface engraving.",
link: "/projects/japanese-pagoda",
skills: ["Laser Cutting", "Design for Fabrication", "Wood Joinery", "Acrylic"],
category: "fabrication",
},
],
archivedProjects: [
{
name: "Cookbook",
description: "A personal recipe library for saving, organizing, scaling, and planning meals.",
link: "/projects/cookbook",
skills: ["Next.js", "TypeScript", "Docker", "Tailscale", "Gemini API", "PWA"],
},
{
name: "Movement Library",
description: "A personal library for finding and organizing movement ideas with structured training references.",
link: "/projects/movement-library",
skills: ["Next.js", "TypeScript", "Docker", "Tailscale", "Gemini API", "PWA"],
},
],
experience: [
{
company: "UCLA Engineering Makerspace",
title: "Fabrication Lab Technician",
dateRange: "Sep 2023 – Jun 2024",
bullets: [
"Assisted students in laser cutting, 3D printing, and digital fabrication tools",
"Supported rapid prototyping for research and class projects",
"Maintained and troubleshot fabrication equipment"
],
},
{
company: "NASA Langley Research Center",
title: "AAM Research Intern",
dateRange: "Feb 2022",
bullets: [
"Led a 10-person team in developing short-term lunar habitat mission pathways",
"Used optimization models in Excel Solver to evaluate scientific return vs cost",
"Co-led final review with NASA engineers and placed 1st out of 16 teams"
],
},
],
education: [
{
school: "University of California, Los Angeles",
degree: "M.S. Mechanical Engineering",
dateRange: "2025 – 2026",
achievements: [
"Specialization in Robotics, Machine Learning, Autonomous Systems",
"Graduate coursework in Reinforcement Learning, Deep Learning, Computer Vision, Autonomous Aerospace Systems, Natural Language Processing, Soft Robotics, Bionic Systems, Data Science"
],
},
{
school: "University of California, Los Angeles",
degree: "B.S. Mechanical Engineering",
dateRange: "2022 – 2024",
achievements: [
"Graduated with 3.54 GPA",
"Graduate-level coursework in Robotics (Kinematics, Dynamics, & Control), Rapid Prototyping, Data Structures & Algorithms",
"Capstone and lab projects spanning robotics, mechanism design, and fabrication"
],
},
],
};
