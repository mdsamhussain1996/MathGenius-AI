// ============================================================
// data.js — RoleFit AI: Job roles, keywords, templates, verbs
// ============================================================

const JOB_ROLES = {
  "Software Engineer": {
    keywords: ["JavaScript","Python","React","Node.js","SQL","REST API","Git","Agile","Data Structures","Algorithms","CI/CD","Docker","AWS","TypeScript","Linux"],
    skills: ["JavaScript","Python","React.js","Node.js","SQL","Git","Data Structures","REST APIs","HTML/CSS","TypeScript"],
    projects: [
      { title: "E-Commerce Web App", desc: "Built a full-stack e-commerce platform using React.js and Node.js with JWT authentication, REST APIs, and MongoDB, supporting 500+ products." },
      { title: "Chat Application", desc: "Developed a real-time chat application using Socket.io and Express.js with user authentication and message history." },
      { title: "Portfolio Website", desc: "Designed and deployed a responsive personal portfolio using HTML, CSS, and JavaScript with 98/100 Lighthouse performance score." }
    ],
    summary: "Motivated software engineering fresher with strong fundamentals in data structures, algorithms, and full-stack web development. Passionate about building scalable, clean-code solutions."
  },
  "Data Analyst": {
    keywords: ["Python","SQL","Excel","Power BI","Tableau","Pandas","NumPy","Machine Learning","Data Visualization","Statistical Analysis","R","Google Analytics","ETL","Dashboards"],
    skills: ["Python","SQL","Excel","Power BI","Pandas","NumPy","Tableau","Data Visualization","Statistics","R"],
    projects: [
      { title: "Sales Dashboard", desc: "Built an interactive Power BI dashboard analyzing 2 years of sales data, identifying trends that improved revenue by 15%." },
      { title: "Customer Churn Prediction", desc: "Developed a logistic regression model in Python achieving 87% accuracy in predicting customer churn for a telecom dataset." },
      { title: "COVID-19 Data Analysis", desc: "Performed exploratory data analysis on WHO COVID-19 dataset using Pandas and Matplotlib, generating actionable visualizations." }
    ],
    summary: "Detail-oriented data analyst fresher skilled in Python, SQL, and data visualization. Experienced in transforming raw data into meaningful business insights through dashboards and statistical models."
  },
  "Marketing Intern": {
    keywords: ["Social Media","Content Marketing","SEO","Google Analytics","Canva","Email Marketing","Campaign Management","Brand Awareness","Market Research","Copywriting","Instagram","LinkedIn","Meta Ads"],
    skills: ["Social Media Marketing","Content Writing","SEO","Google Analytics","Canva","Email Marketing","Market Research","Copywriting","Photoshop","Meta Ads"],
    projects: [
      { title: "Social Media Campaign", desc: "Managed Instagram and LinkedIn campaigns for a local startup, growing followers by 40% and engagement rate by 25% in 2 months." },
      { title: "SEO Blog Strategy", desc: "Developed an SEO-optimized content strategy for a D2C brand, increasing organic traffic by 60% over 3 months." },
      { title: "Market Research Report", desc: "Conducted comprehensive market research analyzing 5 competitor brands, delivering actionable insights presented to senior management." }
    ],
    summary: "Creative and data-driven marketing fresher with hands-on experience in digital marketing, content strategy, and brand building. Passionate about connecting brands with their ideal audience."
  },
  "UI/UX Designer": {
    keywords: ["Figma","Adobe XD","Wireframing","Prototyping","User Research","Design Thinking","Usability Testing","UI Design","Mobile Design","Sketch","Accessibility","Design Systems"],
    skills: ["Figma","Adobe XD","Prototyping","Wireframing","User Research","Design Thinking","Sketch","UI Design","Usability Testing","HTML/CSS"],
    projects: [
      { title: "Food Delivery App Redesign", desc: "Redesigned the checkout flow of a food delivery app using Figma, reducing user drop-off rate by 35% based on usability testing." },
      { title: "Banking App UI", desc: "Designed a clean, accessible mobile banking app UI with a complete design system in Figma, adhering to WCAG 2.1 guidelines." },
      { title: "E-Learning Platform", desc: "Created high-fidelity wireframes and interactive prototypes for an e-learning platform, iterating based on 20+ user interviews." }
    ],
    summary: "Creative UI/UX designer with a strong eye for detail and user-centered design principles. Experienced in Figma, Adobe XD, and design thinking methodologies to craft intuitive digital experiences."
  },
  "Finance Analyst": {
    keywords: ["Financial Modeling","Excel","Valuation","DCF","Accounting","Financial Statements","Bloomberg","SEBI","Mutual Funds","Equity Research","CFA","Tally","GST","Budget Analysis"],
    skills: ["Financial Modeling","Excel","Valuation","Accounting","Tally ERP","Bloomberg","Financial Statements","DCF Analysis","Budget Planning","GST"],
    projects: [
      { title: "DCF Valuation Model", desc: "Built a detailed DCF valuation model for an FMCG company, projecting 5-year cash flows with scenario analysis in Excel." },
      { title: "Portfolio Analysis", desc: "Analyzed a ₹10L mutual fund portfolio using risk-return metrics, recommending rebalancing strategies that improved Sharpe Ratio by 0.3." },
      { title: "Financial Statement Analysis", desc: "Performed ratio analysis on 3 listed companies across P&L, balance sheet, and cash flow statements to assess financial health." }
    ],
    summary: "Analytical finance fresher with strong Excel modeling, valuation, and accounting skills. Adept at translating complex financial data into clear, actionable recommendations."
  },
  "HR Intern": {
    keywords: ["Recruitment","Talent Acquisition","Onboarding","HRMS","Employee Engagement","LinkedIn Recruiter","JD Writing","Performance Management","Payroll","Excel","Communication"],
    skills: ["Recruitment","Talent Acquisition","LinkedIn Recruiter","Onboarding","HRMS","Excel","Communication","JD Writing","Employee Engagement","Performance Management"],
    projects: [
      { title: "Campus Recruitment Drive", desc: "Coordinated a campus recruitment drive across 3 colleges, screening 200+ candidates and successfully onboarding 15 interns." },
      { title: "Employee Engagement Survey", desc: "Designed and analyzed an employee engagement survey for 100+ staff, identifying key areas for improvement in work culture." },
      { title: "HRMS Implementation", desc: "Assisted in migrating employee records to a new HRMS platform, improving data accuracy and reducing manual processing by 40%." }
    ],
    summary: "Enthusiastic HR fresher with strong interpersonal and organizational skills. Experienced in recruitment, onboarding, and employee engagement initiatives with a people-first mindset."
  }
};

const RESUME_TEMPLATES = [
  { id: "classic",  name: "Classic",      tag: "Free",    ats: true,  desc: "Clean single-column, ATS-safe" },
  { id: "modern",   name: "Modern",       tag: "Free",    ats: true,  desc: "Two-column sidebar layout" },
  { id: "minimal",  name: "Minimal",      tag: "Free",    ats: true,  desc: "Ultra-clean whitespace design" },
  { id: "bold",     name: "Bold Pro",     tag: "Premium", ats: false, desc: "Strong headers, standout look" },
  { id: "elegant",  name: "Elegant",      tag: "Premium", ats: true,  desc: "Serif fonts, executive feel" }
];

const ACTION_VERBS = ["Developed","Built","Designed","Implemented","Optimized","Led","Managed","Delivered","Launched","Increased","Reduced","Automated","Collaborated","Architected","Streamlined","Achieved","Contributed","Analyzed","Presented","Coordinated"];

const COVER_LETTER_TEMPLATES = {
  formal: (data) => `Dear Hiring Manager,

I am writing to express my strong interest in the ${data.role} position at ${data.company || "your esteemed organization"}. As a ${data.education || "recent graduate"} with a passion for ${data.field || data.role.toLowerCase()}, I am confident that my skills and dedication make me an excellent candidate for this role.

During my academic journey, I have developed strong expertise in ${(data.skills || []).slice(0,3).join(", ")}. ${data.projects?.length ? `I have worked on projects such as "${data.projects[0].title}", which helped me build practical experience directly relevant to this role.` : "I have consistently applied my academic knowledge to real-world problem-solving."}

I am particularly drawn to this opportunity because it aligns perfectly with my career goals and allows me to contribute meaningfully from day one. I am a quick learner, a team player, and I thrive in dynamic environments.

I would love the opportunity to discuss how I can add value to your team. Thank you for considering my application.

Sincerely,
${data.name || "Your Name"}`,

  confident: (data) => `Dear ${data.company || "Hiring Team"},

I'll be direct — I'm exactly the kind of ${data.role} you're looking for.

With hands-on experience in ${(data.skills || []).slice(0,3).join(", ")}, and a track record of building ${data.projects?.[0]?.title || "impactful projects"}, I bring a rare combination of technical skill, problem-solving mindset, and genuine passion for this field.

What sets me apart? I don't just learn — I execute. ${data.projects?.length ? `My project "${data.projects[0].title}" is proof: ${data.projects[0].desc?.split('.')[0]}.` : "Every challenge I've faced has made me sharper and more resourceful."}

I'm confident I'll hit the ground running at ${data.company || "your company"} and start contributing from week one. I'd love 20 minutes to show you why.

Let's talk.

${data.name || "Your Name"}`
};
