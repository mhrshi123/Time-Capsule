| Use Case                   | Example                                             |
| -------------------------- | --------------------------------------------------- |
| 💌 Letter to Future Self   | “Read this message in 5 years”                      |
| 🎉 Birthday Surprise       | Send a message that unlocks on a friend’s birthday  |
| 🎓 Graduation Motivation   | “If I made it to 2026, I’m proud of you.”           |
| 🔐 Private Journal Entries | Lock your diary entries to be opened months later   |
| 💡 Ideas/Memories Archive  | Archive cool ideas you don’t want to see right away |


| Feature                           | Description                               |
| --------------------------------- | ----------------------------------------- |
| **Create Capsule**                | Form to enter text, pick unlock date      |
| **Capsule Locking Logic**         | Capsule is unreadable before unlock date  |
| **Capsule Listing Page**          | See all user capsules + status            |
| **Capsule View Page**             | When unlocked, shows message & metadata   |
| **(Optional) Email Notification** | Sends email when capsule unlocks          |
| **Auth (Optional)**               | Login/register to manage private capsules |

| Layer               | Tech                                 |
| ------------------- | ------------------------------------ |
| Frontend            | React + Tailwind                     |
| Backend             | Node.js + Express                    |
| Database            | PostgreSQL + Prisma                  |
| Auth (optional)     | JWT or Clerk/Auth0                   |
| Future unlock logic | Prisma date fields + condition check |


