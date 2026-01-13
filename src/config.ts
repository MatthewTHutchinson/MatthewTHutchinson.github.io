export const siteConfig = {
base: "MatthewTHutchinson.github.io",
name: "Matthew Hutchinson",
title: "Mechanical Engineering Graduate Student",
description:
"Portfolio of Matthew Hutchinson, a UCLA-trained mechanical engineer passionate about robotics, design, and building advanced autonomous systems.",
accentColor: "#1d4ed8",
social: {
email: "mahutchinson@ucla.edu",
linkedin: "https://www.linkedin.com/in/matt-hutch/",
twitter: "",
github: "https://github.com/MatthewTHutchinson",
},
aboutMe:
"I'm a mechanical engineer and digital fabricator passionate about robotics, additive manufacturing, and emerging technologies. I enjoy combining creative design with engineering to solve complex real-world problems. Currently pursuing my M.S. in Mechanical Engineering at UCLA (Design, Robotics & Manufacturing).",
skills: [
"Python",
"MATLAB",
"SolidWorks",
"GD&T",
"Data Science",
"Additive Manufacturing",
"Laser Beam Manufacturing",
"Control Systems",
"Git",
"Arduino",
],
projects: [
{
name: "Autonomous Rover for Disk Transport",
description:
"Designed and built a autonomous rover to transport disks across ramps and platforms using camera-based path detection, PID control, and mechanical arm mechanisms.",
link: "/projects/project-a",
skills: ["Python", "SolidWorks", "Arduino"],
},
{
name: "Robotic Arm for Fiber Placement",
description:
"Developed an impedance controller in PyDrake for automated composite fiber placement, focusing on accurate force control and dynamic interaction with mold surfaces.",
link: "[https://github.com/MatthewTHutchinson](https://github.com/MatthewTHutchinson)",
skills: ["Python", "Control Systems", "Simulation", "Robotics"],
},
{
name: "Metal Additive Manufacturing Research",
description:
"Explored multidirectional wire arc and laser wire additive manufacturing strategies, including robotic deposition, thermal gradient control, and digital twin simulation concepts.",
link: "[https://github.com/MatthewTHutchinson](https://github.com/MatthewTHutchinson)",
skills: ["Manufacturing", "Design", "Thermal Analysis"],
},
{
name: "Motorcycle Maintenance & Modding",
description:
"Hands-on work on my Suzuki SV650: performed valve inspections, coolant flush, exhaust upgrade, oil changes.",
link: "[https://github.com/MatthewTHutchinson](https://github.com/MatthewTHutchinson)",
skills: ["Mechanical Systems", "Diagnostics", "Tools"],
},
{
name: "Laser-Cut Japanese Lantern",
description:
"Designed and fabricated a multi-material lantern featuring wood joinery, acrylic panels, and engraving, blending precision design with physical craft.",
link: "[https://github.com/MatthewTHutchinson](https://github.com/MatthewTHutchinson)",
skills: ["Laser Cutting", "Design for Fabrication", "Art & Engineering"],
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
{
company: "UCLA DevX / MAE Capstone",
title: "Robotics Developer",
dateRange: "Jan 2024 – Jun 2024",
bullets: [
"Built autonomous rover with mechanical arm & vision tracking for disk transport",
"Implemented OpenCV and PID motor control on Raspberry Pi/Arduino stack",
"Designed chassis using laser cutting and 3D printing"
],
},
],
education: [
{
school: "University of California, Los Angeles",
degree: "M.S. Mechanical Engineering",
dateRange: "2025 – 2026",
achievements: [
"Specialization in Design, Robotics & Manufacturing",
"Graduate coursework in soft robotics, bionic systems, data science, compliant mechanisms, artificial intelligence",
"Focus: Robotics, Autonomous Systems, Fabrication"
],
},
{
school: "University of California, Los Angeles",
degree: "B.S. Mechanical Engineering",
dateRange: "2022 – 2024",
achievements: [
"Graduated with 3.54 GPA",
"Graduate-level coursework in robotics (Kinematics, Dynamics, & Control), Rapid Prototyping, data structures & algorithms",
"Designed, simulated, & built multiple robotic and mechanical systems"
],
},
],
};