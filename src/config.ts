export const siteConfig = {
base: "MatthewTHutchinson.github.io",
name: "Matthew Hutchinson",
title: "Mechanical Engineering Graduate Student",
description:
"Portfolio of Matthew Hutchinson, a UCLA mechanical engineer focused on robotics, autonomous systems, and fabrication.",
accentColor: "#1d4ed8",
social: {
email: "mahutchinson@ucla.edu",
linkedin: "https://www.linkedin.com/in/matt-hutch/",
twitter: "",
github: "https://github.com/MatthewTHutchinson",
},
aboutMe:
"M.S. Mechanical Engineering at UCLA. I'm interested in how AI and machine learning tools — NLP, deep learning, reinforcement learning — are starting to change what's possible in robotics and physical systems. Most of my work sits at that intersection.",
skills: [
"Python",
"MATLAB",
"SolidWorks",
"GD&T",
"FEA",
"OpenCV",
"Reinforcement Learning",
"Deep Learning",
"Natural Language Processing",
"Additive Manufacturing",
"Laser Cutting",
"Control Systems",
"Git",
"Arduino",
],
projects: [
{
name: "Autonomous Rover for Disk Transport",
description:
"Built an autonomous rover to transport disks across ramps using camera-based line detection, PID control, and a mechanical arm.",
link: "/projects/autonomous-rover",
skills: ["ROS 2", "OpenCV", "SolidWorks", "Controls (PID)", "Raspberry Pi", "Arduino"],
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
name: "Motorcycle Maintenance & Modifications",
description:
"Hands-on work on my Suzuki SV650: performed valve inspections, coolant flush, exhaust upgrade, oil changes.",
link: "/projects/motorcycle",
skills: ["Mechanical Systems", "Diagnostics", "Tools"],
category: "fabrication",
},
{
name: "Laser-Cut Japanese Pagoda",
description:
"A lantern inspired by Japanese pagoda architecture, made from laser-cut wood joinery and surface engraving.",
link: "/projects/japanese-pagoda",
skills: ["Laser Cutting", "Design for Fabrication", "Wood Joinery"],
category: "fabrication",
},
{
name: "Laser-Cut Maps",
description:
"City and campus maps designed in Illustrator and laser-cut from wood at the UCLA Makerspace.",
link: "/projects/laser-cut-maps",
skills: ["Laser Cutting", "Illustrator", "Design for Fabrication"],
category: "fabrication",
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
dateRange: "2025",
achievements: [
"Specialization in Design, Robotics & Manufacturing",
"Graduate coursework in Reinforcement Learning, Deep Learning, Natural Language Processing, Optimal Control, Soft Robotics, Bionic Systems, Data Science",
"Focus: Robotics, Machine Learning, Autonomous Systems"
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