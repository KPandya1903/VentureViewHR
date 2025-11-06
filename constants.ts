import { Job, Candidate } from './types';

export const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    company: 'Innovatech',
    location: 'San Francisco, CA',
    salary: '$150,000 - $180,000',
    type: 'Full-time',
    description: `Innovatech is seeking a passionate Senior Frontend Engineer to build and scale our next-generation user interfaces. You will work with React, TypeScript, and GraphQL to create beautiful and performant applications. Our ideal candidate has a strong understanding of modern web technologies and a keen eye for UX design. You will be responsible for leading projects, mentoring junior developers, and collaborating with cross-functional teams to deliver high-quality products.`,
    tags: ['React', 'TypeScript', 'Remote'],
    companyLogoUrl: 'https://picsum.photos/seed/Innovatech/100'
  },
  {
    id: '2',
    title: 'Product Manager, AI Platforms',
    company: 'DataCorp',
    location: 'New York, NY',
    salary: '$160,000 - $190,000',
    type: 'Full-time',
    description: `DataCorp is at the forefront of AI innovation. We are looking for a Product Manager to drive the strategy and development of our AI platforms. You will work closely with engineering, data science, and design teams to define product requirements, prioritize features, and launch products that delight our customers. A strong technical background and experience in AI/ML products are highly desirable.`,
    tags: ['Product', 'AI/ML', 'Strategy'],
    companyLogoUrl: 'https://picsum.photos/seed/DataCorp/100'
  },
  {
    id: '3',
    title: 'UX/UI Designer',
    company: 'Creative Solutions',
    location: 'Austin, TX',
    salary: '$90,000 - $110,000',
    type: 'Full-time',
    description: `Creative Solutions is looking for a talented UX/UI Designer to join our team. You will be responsible for creating intuitive and visually appealing user experiences across our web and mobile products. This role involves user research, wireframing, prototyping, and collaborating with developers to ensure a high-quality implementation of your designs. Proficiency in Figma and a strong portfolio are required.`,
    tags: ['UX', 'UI', 'Figma', 'Mobile'],
    companyLogoUrl: 'https://picsum.photos/seed/CreativeSolutions/100'
  },
  {
    id: '4',
    title: 'Backend Developer (Python/Django)',
    company: 'SecureNet',
    location: 'Boston, MA',
    salary: '$130,000 - $150,000',
    type: 'Full-time',
    description: `SecureNet is building the future of cybersecurity. We are hiring a Backend Developer with expertise in Python and Django to develop robust and scalable APIs. You will work on our core security products, contributing to a platform that protects millions of users. Experience with PostgreSQL, Celery, and cloud platforms like AWS is a plus.`,
    tags: ['Python', 'Django', 'API', 'Security'],
    companyLogoUrl: 'https://picsum.photos/seed/SecureNet/100'
  },
  {
    id: '5',
    title: 'DevOps Engineer',
    company: 'CloudSphere',
    location: 'Remote',
    salary: '$140,000 - $170,000',
    type: 'Full-time',
    description: `CloudSphere is seeking a DevOps Engineer to automate and streamline our operations and processes. You will be responsible for our CI/CD pipelines, infrastructure as code (Terraform), and monitoring/alerting systems. This is a fully remote role with a talented and distributed team. Join us to build and maintain a world-class cloud infrastructure.`,
    tags: ['DevOps', 'AWS', 'Terraform', 'CI/CD'],
    companyLogoUrl: 'https://picsum.photos/seed/CloudSphere/100'
  },
  {
    id: '6',
    title: 'Data Analyst Internship',
    company: 'Innovatech',
    location: 'San Francisco, CA',
    salary: '$30/hour',
    type: 'Internship',
    description: `Join Innovatech for a summer internship as a Data Analyst! You will work with our business intelligence team to analyze user data, create dashboards, and provide insights that drive business decisions. This is a great opportunity to gain hands-on experience with SQL, Python (Pandas), and data visualization tools like Tableau.`,
    tags: ['Internship', 'Data', 'SQL', 'Tableau'],
    companyLogoUrl: 'https://picsum.photos/seed/Innovatech/100'
  }
];

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'cand_1',
    name: 'Alex Chen',
    avatarUrl: 'https://picsum.photos/seed/AlexChen/100',
    role: 'Senior Frontend Engineer',
    interviewReport: {
      overallScore: 88,
      summary: "Alex is a very strong technical candidate with excellent communication skills. They provided clear, well-structured answers to all questions and demonstrated deep expertise in React and system design. Confidence was high, and all answers were highly relevant. A top-tier candidate.",
      answers: [
        {
          question: "Can you describe a challenging project you've worked on and how you handled it?",
          transcript: "Certainly. In my previous role at TechCorp, I led the migration of a monolithic legacy frontend to a micro-frontend architecture using React and Webpack 5 module federation. The main challenge was ensuring zero downtime and maintaining feature parity...",
          evaluation: { clarity: 95, confidence: 90, relevance: 90, feedback: "Excellent use of the STAR method. The explanation was clear, detailed, and directly showcased leadership and technical skills." }
        },
        {
          question: "How do you approach state management in a large-scale React application?",
          transcript: "For large-scale applications, I typically advocate for a centralized state management solution like Redux or Zustand. It depends on the team's familiarity and the complexity of the state. I've found Zustand to be more lightweight and have less boilerplate...",
          evaluation: { clarity: 85, confidence: 90, relevance: 95, feedback: "Strong answer. Showed awareness of multiple tools and the trade-offs involved, which demonstrates senior-level thinking." }
        }
      ]
    }
  },
  {
    id: 'cand_2',
    name: 'Brenda Garcia',
    avatarUrl: 'https://picsum.photos/seed/BrendaGarcia/100',
    role: 'UX/UI Designer',
    interviewReport: {
      overallScore: 76,
      summary: "Brenda has a good eye for design and a solid understanding of the UX process. She communicated her ideas well but could benefit from providing more data-driven examples to back up her design decisions. Her answers were clear but sometimes lacked depth on the 'why' behind her choices.",
      answers: [
        {
          question: "Walk me through your design process for a new feature.",
          transcript: "Okay, so I usually start with understanding the requirements from the product manager. Then I'll do some user research, create some personas, and then move into wireframing and prototyping in Figma. After that, I'll work with developers.",
          evaluation: { clarity: 80, confidence: 70, relevance: 85, feedback: "A good overview of the standard UX process. To improve, try to incorporate specific examples or mention how you'd use research to validate assumptions at each stage." }
        },
        {
          question: "How do you handle feedback from stakeholders that you disagree with?",
          transcript: "That's a good question. I try to understand their perspective and the business goals they're trying to achieve. I would present my design rationale and try to find a compromise, maybe through A/B testing the different approaches.",
          evaluation: { clarity: 75, confidence: 70, relevance: 75, feedback: "Solid answer. Mentioning A/B testing is a great way to introduce data into the decision-making process. Providing a specific example would make this even stronger." }
        }
      ]
    }
  },
  {
    id: 'cand_3',
    name: 'Carlos Rodriguez',
    avatarUrl: 'https://picsum.photos/seed/CarlosRodriguez/100',
    role: 'DevOps Engineer',
    interviewReport: {
      overallScore: 65,
      summary: "Carlos has foundational knowledge in DevOps principles but seemed nervous, which impacted the clarity of his answers. He struggled to provide detailed examples from his past experience. There's potential, but he may be better suited for a more junior role or require further development.",
      answers: [
        {
          question: "Describe your experience with Infrastructure as Code.",
          transcript: "I've used Terraform. It's for, you know, managing infrastructure. I wrote some scripts to spin up EC2 instances and an S3 bucket. It helps make things repeatable.",
          evaluation: { clarity: 60, confidence: 50, relevance: 70, feedback: "The answer is correct but lacks detail. A stronger answer would describe a specific project, the resources managed, and the benefits the team saw from using IaC." }
        },
        {
          question: "How would you design a CI/CD pipeline for a new microservice?",
          transcript: "Um, I would use Jenkins or maybe GitHub Actions. The pipeline would, uh, build the code, run some tests, and then deploy it. Maybe to Kubernetes or something.",
          evaluation: { clarity: 55, confidence: 50, relevance: 65, feedback: "The answer touches on the right components, but it's very high-level. Showing more confidence and detailing the specific stages (e.g., linting, unit tests, integration tests, containerization, deployment strategy) would significantly improve this." }
        }
      ]
    }
  }
];