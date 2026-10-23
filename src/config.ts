export const siteConfig = {
base: "MatthewTHutchinson.github.io",
name: "Matthew Hutchinson",
title: "M.S. Mechanical Engineering | Robotics and Artificial Intelligence",
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
"I build robotics software, with a focus on motion planning, feedback control and hardware integration. My work includes camera-based rover autonomy, kinematic modeling for a parallel mechanism, and actuator communication and diagnostics for an 18-actuator hexapod. I'm interested in advanced control and state estimation for autonomous systems, and in how machine learning can improve perception and planning. I enjoy developing algorithms and testing how they behave on physical hardware.",
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
tripteronStudy: {
commonY: 600, grid: 5, hingeBuffer: 15, railBuffer: 20,
// Oct 21, 2026: connected level-light translation study; collision checks excluded.
samples: [[25, 93.75], [50, 161.75], [60, 171.25], [65, 172.25], [70, 171.75], [75, 169.75], [80, 166.75], [85, 162.75], [90, 157.25], [100, 128.75], [125, 61.25], [150, 16.25]],
},
projects: [
{
name: "Tripteron",
description:
"Developed CAD-derived kinematics, constraint-aware motion planning, and browser controls for a parallel robot. Studied paired-platform workspaces for a moving light installation.",
link: "/projects/tripteron",
skills: ["Python", "Kinematics", "Motor Control", "Motion Planning", "Workspace Analysis", "Klipper"],
category: "engineering",
},
{
name: "Hexapod",
description:
"Built a Python/ROS 2 control stack and operator UI for an 18-actuator hexapod being prepared for an art museum in Korea, with dual CAN buses, 100 Hz motion, and telemetry logging.",
link: "/projects/hexapod",
skills: ["Python", "ROS 2", "CAN Bus", "Motor Control", "Motion Planning", "Diagnostics"],
category: "engineering",
},
{
name: "MapLaser",
description:
"Built a geospatial web app that turns OpenStreetMap and elevation data into layered laser-cut SVGs and 3D terrain models, with interactive crops, physical road widths, and GPX route overlays.",
link: "/projects/laser-cut-maps",
skills: ["Python", "FastAPI", "Geospatial Processing", "Three.js", "Digital Fabrication"],
category: "fabrication",
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
"Simulated automated fiber placement with a UR5e in PyDrake, using impedance control to study contact forces, trajectory tracking, and recovery from disturbances.",
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
"Maintained and modified my Suzuki SV650, including valve inspections, a coolant flush, an exhaust upgrade, and oil changes.",
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
dateRange: "Apr 2024 – Jul 2024",
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
