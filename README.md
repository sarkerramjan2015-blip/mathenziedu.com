# Mathenzi Edu

**Master Mathematics with Logic, Practice & Confidence**

A premium Bangladesh-focused mathematics learning ecosystem for school students, O Level/A Level learners, olympiad aspirants, and admission candidates.

**Bangla Tagline:** "গণিত হোক সহজ, যুক্তিতে হোক শক্তিশালী"

### Demo Mode (Local Preview)

Demo mode allows exploring the full website without Firebase authentication. It is controlled by environment variable:

```bash
# .env.local
VITE_DEMO_MODE=true
```

**When enabled:**
- Login page shows "Demo Student" and "Demo Admin" buttons
- Click a demo button to instantly log in — no real Firebase auth needed
- Demo sessions use localStorage, not Firestore
- All demo data is local-only

**When disabled (default):**
- Firebase authentication is required
- Demo buttons are hidden
- Demo localStorage sessions are ignored

**⚠️ Never deploy to production with VITE_DEMO_MODE=true.**

---

## Features

- **Category Architecture** — 5 main categories (Academic Maths, Olympiad, Admission Course, Books Corner, Mathematics & Nature) with 40+ subcategories
- **Courses** — Structured learning paths with curriculum tracking, enrollment, and progress
- **Books Corner** — Free and paid books with bKash purchase flow
- **Exams** — MCQ auto-evaluation and written submission with admin review
- **Certificates** — Printable certificates for completed courses and evaluated exams
- **Manual bKash Payment** — Order → bKash payment → transaction ID submission → admin verification → access unlock
- **Student Dashboard** — Course progress, exam attempts, certificates, saved articles, payment history
- **Admin Panel** — Overview analytics, CRUD for all content, payment verification, exam evaluation, certificate management, contact messages viewer
- **Role-Based Security** — Firestore role field + legacy admin email fallback
- **Authentication** — Firebase Auth (Email/Password + Google Sign-In)
- **SEO** — Per-page meta tags, Open Graph, Twitter Cards, sitemap.xml, robots.txt, manifest.json
- **Mobile Responsive** — Tailwind CSS 4 dark theme, optimized for Bangladesh mobile-heavy market
- **SSLCommerz Future-Ready** — Payment config placeholders ready for integration (currently inactive)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS 4, Motion (Framer) |
| Routing | React Router v7 |
| Backend/Database | Firebase Firestore |
| Authentication | Firebase Auth |
| SEO | react-helmet-async |
| Icons | Lucide React |
| Build | Vite 6 |

---

## Project Structure

```
mathenziedu/
├── public/
│   ├── robots.txt
│   ├── sitemap.xml
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminArticles.tsx
│   │   │   ├── AdminBooks.tsx
│   │   │   ├── AdminCategories.tsx
│   │   │   ├── AdminCertificates.tsx
│   │   │   ├── AdminContactMessages.tsx
│   │   │   ├── AdminCourses.tsx
│   │   │   ├── AdminEnrollments.tsx
│   │   │   ├── AdminExamEvaluation.tsx
│   │   │   └── AdminExamQuestions.tsx
│   │   ├── BkashPaymentSection.tsx
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── SEO.tsx
│   │   └── UserSavedArticles.tsx
│   ├── lib/
│   │   ├── admin.ts
│   │   ├── AuthContext.tsx
│   │   ├── config.ts
│   │   ├── data.ts
│   │   ├── firebase.ts
│   │   ├── media.ts
│   │   └── types.ts
│   ├── pages/
│   │   ├── About.tsx
│   │   ├── Admission.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── ArticleDetails.tsx
│   │   ├── Articles.tsx
│   │   ├── Books.tsx
│   │   ├── CertificateView.tsx
│   │   ├── Contact.tsx
│   │   ├── CourseDetails.tsx
│   │   ├── Courses.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ExamDetails.tsx
│   │   ├── Exams.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── Home.tsx
│   │   ├── Legal.tsx
│   │   ├── Login.tsx
│   │   ├── MathematicsNature.tsx
│   │   ├── NotFound.tsx
│   │   ├── Register.tsx
│   │   └── TakeExam.tsx
│   ├── App.tsx
│   └── main.tsx
├── firestore.rules
├── firebase-applet-config.json
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Local Setup

```bash
# Clone the repository
git clone <repo-url>
cd mathenziedu

# Install dependencies
npm install

# Start development server
npm run dev
# Opens at http://localhost:3000

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password + Google providers)
3. Create a **Firestore Database** (in test mode initially)
4. Get your Firebase config from Project Settings → Web App
5. Create `firebase-applet-config.json` in the project root:

```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT.appspot.com",
  "messagingSenderId": "YOUR_SENDER_ID",
  "appId": "YOUR_APP_ID",
  "firestoreDatabaseId": "(default)"
}
```

6. Deploy `firestore.rules` to Firebase using the Firebase CLI or Firebase Console

---

## How to Make a User Admin

1. Go to Firebase Console → Firestore Database
2. Find the user document in the `users/{userId}` collection
3. Set the field `role: 'admin'`
4. User must sign out and sign in again for the role to take effect

Alternatively, add the email to `LEGACY_ADMIN_EMAILS` in `src/lib/config.ts` (fallback method for migration).

---

## How to Add Content

### Categories
Admin Panel → Manage Categories tab

### Courses
Admin Panel → Manage Courses tab, or use **Admin: Seed Default Data** button on Home page (admin only)

### Books
Admin Panel → Manage Books tab

### Exams & Questions
Admin Panel → Exam Questions tab to add questions for each exam

### Articles
Admin Panel → Manage Articles tab

---

## Manual bKash Payment Workflow

1. Student creates an order (course/book/exam)
2. Order status is `pending`, paymentMethod is `bkash_manual`
3. Student sees bKash payment instructions with merchant number
4. Student sends payment via bKash app
5. Student submits transaction ID via BkashPaymentSection form
6. Admin sees submission in Admin → Enrollments → bKash Submissions tab
7. Admin verifies → order becomes `paid`, enrollment created
8. Admin rejects → student can resubmit

**bKash number is configured in** `src/lib/config.ts` → `BKASH_MANUAL.number`

---

## Certificate Workflow

1. Student completes all lessons in a course (progress 100%) — appears in admin certificate list
2. Student's written exam gets evaluated — appears in admin certificate list
3. Admin Panel → Certificates tab → Issue Certificate
4. Certificate generates with unique number (MZ-XXXX-XXXX format)
5. Student sees certificate in Dashboard → Certificates tab
6. Click View → printable certificate page
7. Admin can revoke certificates (shows "Revoked" watermark)

---

## Deployment

```bash
# Build
npm run build

# Deploy /dist folder to Firebase Hosting or any static host
firebase deploy --only hosting
```

Or deploy to:
- **Vercel** — connect Git repo, Vite framework auto-detected
- **Netlify** — connect Git repo, build command: `npm run build`, publish dir: `dist`
- **Cloudflare Pages** — connect Git repo, build command: `npm run build`, output dir: `dist`

---

## Known Limitations

- No lesson/video content delivery system — curriculum is a tracking checklist
- No automated certificate issuance — admin issues certificates manually
- No email notifications for payments, messages, or certificate issuance
- bKash payment is manual (human verification) — no automated bKash API integration
- Exam metadata is static in `data.ts` — not stored in Firestore
- No PWA/offline support
- No multi-language support (English only)
- No anti-cheating on exams (no tab-switch detection)
- No profile picture upload

---

## Future SSLCommerz Integration

The project has SSLCommerz (and other payment gateway) configuration ready in `src/lib/config.ts`.

To integrate SSLCommerz:
1. Set `PAYMENT_PROVIDERS.sslcommerz.active = true`
2. Implement a Firebase Cloud Function for SSLCommerz session initiation
3. Update the order creation flow to use SSLCommerz redirect when available
4. Add SSLCommerz success/fail/cancel callback pages

---

Co-authored-by: CommandCodeBot <noreply@commandcode.ai>
