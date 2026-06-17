require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in env variables!");
  process.exit(1);
}

const credentialsData = [
  {
    candidateName: "Somil Urmil Shah",
    seniorRecruiter: "Smit H Patel",
    recruiter: "Meghal Patel",
    email: "somil.s@mycvscout.com",
    password: "Somil@3003"
  },
  {
    candidateName: "Shiva karan Reddy",
    seniorRecruiter: "Smit H Patel",
    recruiter: "Meghal Patel",
    email: "shivakaran.r@protectmymails.com",
    password: "Netbounce@007"
  },
  {
    candidateName: "Sravani Goud Bushigampala",
    seniorRecruiter: "Smit H Patel",
    recruiter: "Meghal Patel",
    email: "bushigampala.g@mycvscout.com",
    password: "Bushigampala@1604"
  },
  {
    candidateName: "Manvitha Rao",
    seniorRecruiter: "Smit H Patel",
    recruiter: "Meghal Patel",
    email: "manvitha.r@mymailshub.com",
    password: "Manvitha@2025"
  },
  {
    candidateName: "Deep Bhagat",
    seniorRecruiter: "Smit H Patel",
    recruiter: "Meghal Patel",
    email: "deep.b@mycvscout.com",
    password: "Deep@0704"
  },
  {
    candidateName: "Manikanteswar Gandrothula",
    seniorRecruiter: "Smit H Patel",
    recruiter: "Meghal Patel",
    email: "manikanteswar.g@mycvscout.com",
    password: "Manikanteswar@1006"
  },
  {
    candidateName: "Sireesha Gangarapu",
    seniorRecruiter: "Smit H Patel",
    recruiter: "Meghal Patel",
    email: "sireesha.g@mycvhire.com",
    password: "Sireesha@2026"
  },
  {
    candidateName: "Pallavi Thorat",
    seniorRecruiter: "Smit H Patel",
    recruiter: "Meghal Patel",
    email: "pallavi.t@mymailkeeper.com",
    password: "Pallavi@2904"
  },
  {
    candidateName: "Usha Sree Kandulapati",
    seniorRecruiter: "Smit H Patel",
    recruiter: "Meghal Patel",
    email: "usha.k@careernb.com",
    password: "Usha@0605"
  },
  {
    candidateName: "Kshitij Chegondi",
    seniorRecruiter: "Smit H Patel",
    recruiter: "Dhaval Sathvara",
    email: "kshitij.c@mycvhire.com",
    password: "Kshitij@2204"
  },
  {
    candidateName: "Nageshwar Reddy",
    seniorRecruiter: "Smit H Patel",
    recruiter: "Mittal Sharma",
    email: "nageshwar.r@protectmymails.com",
    password: "Nageshwar@1302"
  },
  {
    candidateName: "Sai Divya Ramavath",
    seniorRecruiter: "Smit H Patel",
    recruiter: "Dhaval Sathvara",
    email: "saidivya.r@mailjobhub.com",
    password: "Saidivya@0801"
  },
  {
    candidateName: "Pranav Sharma",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Kunjan Bhatt",
    email: "pranav.s@myjobscouts.com",
    password: "Pranav@0901"
  },
  {
    candidateName: "Dhara Rameshbhai Chandpara",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Kunjan Bhatt",
    email: "dhara.d@mycvhire.com",
    password: "Dhara@2025"
  },
  {
    candidateName: "Krishna Charitha Atluri",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Kunjan Bhatt",
    email: "krishna.a@mycvhire.com",
    password: "Krishna@2204"
  },
  {
    candidateName: "Keerthi Mandaloju",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Kunjan Bhatt",
    email: "keerthi.m@mymailkeeper.com",
    password: "Keerthi@0105"
  },
  {
    candidateName: "Nidhi Bomble",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Kunjan Bhatt",
    email: "nidhi.b@careernb.com",
    password: "Nidhi@0605"
  },
  {
    candidateName: "Rohit Adike",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Kunjan Bhatt",
    email: "rohit.a@cvmailhub.com",
    password: "Rohit@2005"
  },
  {
    candidateName: "Shreya Dilip Shere",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Hinanshi Sukhadiya",
    email: "shreya.s@cvmailhub.com",
    password: "Shreya@0904"
  },
  {
    candidateName: "Sai Sree Ram Maddala",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Henil Soni",
    email: "saisree.r@mycvtalent.com",
    password: "Saisree@2503"
  },
  {
    candidateName: "Shubham Agarwal",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Brij Gunjal",
    email: "shubham.a@ajobguide.com",
    password: "Shubham@2503"
  },
  {
    candidateName: "Vishwak nunna",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Rajat Limbachiya",
    email: "vishwak.n@savemymails.com",
    password: "Vishwak@1612"
  },
  {
    candidateName: "Naveen panneti",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Rajat Limbachiya",
    email: "naveen.p@savemymails.com",
    password: "Naveen@2201"
  },
  {
    candidateName: "Suhith ghanathay",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Rajat Limbachiya",
    email: "suhith.g@mycvscout.com",
    password: "Suhith@1203"
  },
  {
    candidateName: "Arun nathi",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Rajat Limbachiya",
    email: "arun.n@careernb.com",
    password: "Arun@0302"
  },
  {
    candidateName: "Maneeshwar marpu",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Rajat Limbachiya",
    email: "maneeshwar.m@mycvhire.com",
    password: "Maneeshwar@2005"
  },
  {
    candidateName: "Bharath kumar mandha",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Rajat Limbachiya",
    email: "bmandha91@gmail.com",
    password: "Bharath@1206"
  },
  {
    candidateName: "Sravya vemireddy",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Rajat Limbachiya",
    email: "sravya.v@mycvscout.com",
    password: "Sravya@0204"
  },
  {
    candidateName: "Kalesha vali shaik",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Rajat Limbachiya",
    email: "kalesha.s@careernb.com",
    password: "Kalesha@0403"
  },
  {
    candidateName: "Keerthi yetukuri",
    seniorRecruiter: "Hinanshi Sukhadiya",
    recruiter: "Rajat Limbachiya",
    email: "keerthi.y@mailjobhub.com",
    password: "Keerthi@2025"
  },
  {
    candidateName: "Akshaya Gavhane",
    seniorRecruiter: "Barot Himanshu",
    recruiter: "Rutu Asodiya",
    email: "akshaya.g@cvmailhub.com",
    password: "Akshaya@0904"
  },
  {
    candidateName: "Shiny Saka",
    seniorRecruiter: "Barot Himanshu",
    recruiter: "Rutu Asodiya",
    email: "shiny.s@careernb.com",
    password: "Shiny@1003"
  },
  {
    candidateName: "Chandra Adhikari",
    seniorRecruiter: "Barot Himanshu",
    recruiter: "Rutu Asodiya",
    email: "chandra.adhikari0411@gmail.com",
    password: "Chandra@3103"
  },
  {
    candidateName: "Harshitha Awar",
    seniorRecruiter: "Barot Himanshu",
    recruiter: "Rutu Asodiya",
    email: "harshitha.a@ajobguide.com",
    password: "Harshitha@1704"
  },
  {
    candidateName: "Chandrasekhar Neelam",
    seniorRecruiter: "Barot Himanshu",
    recruiter: "Rutu Asodiya",
    email: "chandrasekhar.n@careernb.com",
    password: "Chandrashekhar@0603"
  },
  {
    candidateName: "Sandeep Damodharreddy",
    seniorRecruiter: "Barot Himanshu",
    recruiter: "Krupal Modi",
    email: "sandeep.r@mycvscout.com",
    password: "Sandeep@2003"
  },
  {
    candidateName: "Manogna Tammisetti",
    seniorRecruiter: "Barot Himanshu",
    recruiter: "Krupal Modi",
    email: "manogna.t@careernb.com",
    password: "Manogna@0104"
  },
  {
    candidateName: "Jayanth Reddy",
    seniorRecruiter: "Barot Himanshu",
    recruiter: "Krupal Modi",
    email: "jayanth.r@mycvtalent.com",
    password: "Jayanth@1903"
  },
  {
    candidateName: "Shubham Mendapara",
    seniorRecruiter: "Barot Himanshu",
    recruiter: "Krupal Modi",
    email: "shubham.m@mycvhire.com",
    password: "Shubham@2704"
  },
  {
    candidateName: "Raviteja Narra",
    seniorRecruiter: "Barot Himanshu",
    recruiter: "Krupal Modi",
    email: "raviteja.n@cvmailhub.com",
    password: "Raviteja@0406"
  },
  {
    candidateName: "Ragini Chowdary Kommi",
    seniorRecruiter: "Barot Himanshu",
    recruiter: "Krupal Modi",
    email: "ragini.c@careernb.com",
    password: "Ragini@0406"
  },
  {
    candidateName: "Anchal Awasthi",
    seniorRecruiter: "Riyen Sukhadiya",
    recruiter: "Pratham Sathavara",
    email: "anchal.a@mycvtalent.com",
    password: "Anchal@2404"
  },
  {
    candidateName: "Sree Dharani Reddy",
    seniorRecruiter: "Riyen Sukhadiya",
    recruiter: "Hardik Yogi",
    email: "dharani.r@savemymails.com",
    password: "Dharani@1701"
  },
  {
    candidateName: "Madhulika Gangarajula",
    seniorRecruiter: "Riyen Sukhadiya",
    recruiter: "Hardik Yogi",
    email: "madhulika.g@careernb.com",
    password: "Madhulika@1702"
  },
  {
    candidateName: "Abhishek Mule",
    seniorRecruiter: "Riyen Sukhadiya",
    recruiter: "Hardik Yogi",
    email: "abhishek.m@careernb.com",
    password: "Abhishek@2805"
  },
  {
    candidateName: "Vibhor Kashmira",
    seniorRecruiter: "Riyen Sukhadiya",
    recruiter: "Hardik Yogi",
    email: "kashmira.v@mycvhire.com",
    password: "Kashmira@1203"
  },
  {
    candidateName: "FNU ADITI",
    seniorRecruiter: "Riyen Sukhadiya",
    recruiter: "Hardik Yogi",
    email: "aditi.f@ajobguide.com",
    password: "Aditi@1504"
  },
  {
    candidateName: "Venkat Sai Sri Harsha Tripuraneni",
    seniorRecruiter: "Riyen Sukhadiya",
    recruiter: "Yatri Parmar",
    email: "venkatsai.t@savemymails.com",
    password: "Venkatsai@2901"
  },
  {
    candidateName: "Sai Vaishnavi Pratapa",
    seniorRecruiter: "Riyen Sukhadiya",
    recruiter: "Yatri Parmar",
    email: "saivaishnavi.p@protectmymails.com",
    password: "Saivaishnavi@1902"
  },
  {
    candidateName: "Vaishnavi Nagu",
    seniorRecruiter: "Riyen Sukhadiya",
    recruiter: "Yatri Parmar",
    email: "vaishnavi.n@savemymails.com",
    password: "Vaishnavi@2901"
  },
  {
    candidateName: "Paul Roweena",
    seniorRecruiter: "Riyen Sukhadiya",
    recruiter: "Yatri Parmar",
    email: "paul.r@careernb.com",
    password: "Paul@1405"
  },
  {
    candidateName: "Rohith Arabati",
    seniorRecruiter: "Shekh Mohmadrehan",
    recruiter: "Harsh Sadhu",
    email: "rohith.a@protectmymails.com",
    password: "Rohith@1602"
  },
  {
    candidateName: "Charmy Darji",
    seniorRecruiter: "Shekh Mohmadrehan",
    recruiter: "Harsh Sadhu",
    email: "charmy.d@cvmailhub.com",
    password: "Charmy@0904"
  },
  {
    candidateName: "Divya Chowdary Koripalli",
    seniorRecruiter: "Shekh Mohmadrehan",
    recruiter: "Hardik Vaghela",
    email: "divya.c@protectmymails.com",
    password: "Divya@2502"
  },
  {
    candidateName: "Hema Lalitha Surya Lakshmi Ayaluri",
    seniorRecruiter: "Shekh Mohmadrehan",
    recruiter: "Hardik Vaghela",
    email: "hema.l@mailjobhub.com",
    password: "Hema@2104"
  },
  {
    candidateName: "Akshaya Mudar",
    seniorRecruiter: "Shekh Mohmadrehan",
    recruiter: "Sakshi Prajapati",
    email: "akshaya.m@mycvtalent.com",
    password: "Akshaya@2026"
  },
  {
    candidateName: "Yashaswini Sree Neha Garapati",
    seniorRecruiter: "Shekh Mohmadrehan",
    recruiter: "Sakshi Prajapati",
    email: "yashaswini.g@mycvscout.com",
    password: "Yashaswini@2204"
  },
  {
    candidateName: "Sathwik Vuppala",
    seniorRecruiter: "Shekh Mohmadrehan",
    recruiter: "Ajay Parmar",
    email: "sathwik.v@ajobguide.com",
    password: "Sathwik@1504"
  },
  {
    candidateName: "Kavya Naidu",
    seniorRecruiter: "Shekh Mohmadrehan",
    recruiter: "Ajay Parmar",
    email: "kavya.n@cvmailhub.com",
    password: "Kavya@0904"
  },
  {
    candidateName: "Dami Gupta",
    seniorRecruiter: "Vishal Suthar",
    recruiter: "Vishal Suthar",
    email: "dami.g@mycvscout.com",
    password: "Dami@2403"
  },
  {
    candidateName: "Pavan Kalam",
    seniorRecruiter: "Vishal Suthar",
    recruiter: "Aftab Fakir",
    email: "pavan.k@savemymails.com",
    password: "Pavan@2026"
  },
  {
    candidateName: "Hamsini Reddy Gunda",
    seniorRecruiter: "Vishal Suthar",
    recruiter: "Aftab Fakir",
    email: "hamsini.g@careernb.com",
    password: "Hamsini@0404"
  },
  {
    candidateName: "Deepika Thakur",
    seniorRecruiter: "Vishal Suthar",
    recruiter: "Dax Patel",
    email: "deepika.t@mycvscout.com",
    password: "Deepika@2105"
  },
  {
    candidateName: "Sindhuja Gundla",
    seniorRecruiter: "Vishal Suthar",
    recruiter: "Nitya Soni",
    email: "sindhuja.g@savemymails.com",
    password: "Sindhuja@2025"
  },
  {
    candidateName: "Shubhangi Mishra",
    seniorRecruiter: "Vishal Suthar",
    recruiter: "Chintan Raval",
    email: "shubhangi.m@careernb.com",
    password: "Shubhangi@0605"
  },
  {
    candidateName: "Sohankumar Akki",
    seniorRecruiter: "Vishal Suthar",
    recruiter: "Chintan Raval",
    email: "sohan.a@mycvscout.com",
    password: "Sohan@1505"
  },
  {
    candidateName: "Sumanth Chada",
    seniorRecruiter: "SR Shilp",
    recruiter: "Hardik Yogi",
    email: "",
    password: ""
  }
];

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 20000,
  connectTimeoutMS: 20000,
  family: 4,
  tls: true,
})
.then(async () => {
  console.log("Connected to MongoDB for seeding Candidate Credentials...");
  const CandidateCredential = mongoose.model('CandidateCredential', new mongoose.Schema({}, { strict: false }));
  
  // Clear any existing credentials
  await CandidateCredential.deleteMany({});
  console.log("Cleared CandidateCredential collection.");

  const docs = await CandidateCredential.insertMany(credentialsData);
  console.log(`Successfully seeded ${docs.length} candidate credentials!`);
  process.exit(0);
})
.catch(err => {
  console.error("Credentials seeding failed:", err);
  process.exit(1);
});
