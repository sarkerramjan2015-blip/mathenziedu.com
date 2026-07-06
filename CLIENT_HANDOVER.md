# CLIENT HANDOVER — Mathemzi Edu

**Delivery Date:** July 2026
**Version:** 1.0 (Client-Ready)

---

## 1. Admin Login Setup

The admin role is controlled via Firestore. To set up admin access:

1. Register a new account on the website (or use existing account)
2. Go to Firebase Console → Firestore Database → `users` collection
3. Find the document with your user ID
4. Set the field `role: 'admin'`
5. Sign out and sign in again — you will see the admin panel at `/admin`

**Fallback (if Firestore isn't ready):** Add your email to `LEGACY_ADMIN_EMAILS` in `src/lib/config.ts` and rebuild.

### Demo Mode Access

For client preview without Firebase, enable demo mode:

1. Create `.env.local` file in the project root
2. Add `VITE_DEMO_MODE=true`
3. Run `npm run dev`
4. On the Login page, click **"Demo Student"** or **"Demo Admin"**

**Demo Student** — explores dashboard, courses, books, exams as a student
**Demo Admin** — explores admin panel, manages content, views analytics

Demo passwords shown on screen are UI reference only. No real Firebase login required. All demo data is stored in browser localStorage. Changes are local-only and reset when the browser is cleared.

**⚠️ Never set VITE_DEMO_MODE=true in production builds.**

---

## 2. Demo Checklist

After logging in as admin, verify these flows:

### Content Management
- [ ] Add a new course from Admin → Manage Courses
- [ ] Add a new book from Admin → Manage Books
- [ ] Add a new article from Admin → Manage Articles
- [ ] Add exam questions from Admin → Exam Questions
- [ ] Manage categories from Admin → Manage Categories

### Payment Verification
- [ ] Have a test student create a paid order
- [ ] Student submits bKash transaction ID
- [ ] Admin verifies payment from Admin → Enrollments → bKash Submissions tab
- [ ] Verified payment unlocks course access

### Exam Evaluation
- [ ] Have a student take a written exam
- [ ] Admin evaluates from Admin → Exam Evaluation
- [ ] Student sees evaluation in Dashboard → My Exams

### Certificates
- [ ] Admin issues certificate from Admin → Certificates
- [ ] Student views certificate from Dashboard → Certificates
- [ ] Print certificate page works

### Contact Messages
- [ ] Visitor submits contact form
- [ ] Admin views message from Admin → Messages
- [ ] Admin marks as read/replied

---

## 3. Client Testing Checklist

### Public Pages
- [ ] Home page loads with correct hero, categories, courses
- [ ] About page loads
- [ ] Courses listing filters by category
- [ ] Course detail page shows curriculum, outcomes, enrollment button
- [ ] Books Corner shows books with search and filter
- [ ] Exams listing shows exam cards
- [ ] Mathematics & Nature page loads
- [ ] Articles load with content
- [ ] Contact form submits successfully
- [ ] Login/Register works (Email + Google)
- [ ] Forgot Password sends reset email

### Student Dashboard
- [ ] Enrolled courses show with progress
- [ ] Exam attempts show with scores
- [ ] Certificates tab shows issued certs
- [ ] Saved Articles works
- [ ] Payment & Orders tab shows history

### Mobile Responsiveness
- [ ] Navbar hamburger menu works
- [ ] Course cards wrap correctly
- [ ] Admin tables scroll horizontally
- [ ] Payment section fits small screens
- [ ] Contact form is usable on mobile

---

## 4. Payment Workflow Explanation

**How bKash payment works:**

1. Student clicks "Enroll" on a paid course (or "Buy" on a paid book)
2. An order is created with status `pending`
3. On-screen instructions show the bKash number and amount
4. Student sends money via their bKash app
5. Student returns to the website and submits:
   - Their bKash number
   - The bKash Transaction ID (TrxID)
6. Admin team logs in and checks:
   - Admin → Enrollments → bKash Submissions tab
   - Verifies the transaction ID matches the amount
7. Admin clicks **Verify** → Order becomes `paid` → Student gets access
8. If payment is wrong, Admin clicks **Reject** with a note → Student can resubmit

**Important:** This is a manual process. No automated payment gateway. It requires a human admin to verify bKash transactions.

---

## 5. Exam Workflow Explanation

**For Students:**

1. Browse exams at `/exams`
2. Click an exam to see details (questions, duration, marks)
3. For free exams: click "Start Exam" → timer starts
4. For paid exams: create order, pay via bKash, wait for admin verification
5. Answer MCQ questions by selecting options
6. Answer Written questions in the text area
7. Submit before timer ends (auto-submits if time runs out)
8. MCQs are instantly graded
9. Written answers go to admin for evaluation
10. Check Dashboard → My Exams for results

**For Admins:**

1. Admin → Exam Questions: Add/modify questions for each exam
2. Admin → Exam Evaluation: Review written answers, assign marks, give feedback
3. Admin → Certificates: Issue certificates for evaluated exams

---

## 6. Certificate Workflow Explanation

1. A student completes a course (100% progress) or an exam gets evaluated
2. These appear in the admin Certificates tab
3. Admin clicks "Issue Certificate" → certificate is created with:
   - Unique certificate number (MZ-XXXX-XXXX)
   - Student name
   - Course/Exam title
   - Score/grade (if exam-based)
   - Issue date
4. Student sees certificate in Dashboard → Certificates
5. Click "View" → opens printable certificate page
6. Use browser print (Ctrl+P / Cmd+P) to save as PDF
7. Admin can revoke certificates if needed (shows "Revoked" watermark)

---

## 7. Future Improvement List

### Short-term (6 months)
- Add lesson/video content delivery system (currently curriculum is tracking only)
- Integrate SSLCommerz automated payment (config ready, needs Cloud Function)
- Send email notifications for payments, messages, certificates
- Add PWA support for offline access
- Add Bengali language support

### Medium-term (6-12 months)
- Anti-cheating for exams (tab-switch detection, proctoring)
- Auto certificate issuance when course completed or exam evaluated
- Student profile pictures and profile editing
- Rich text editor for articles (currently plain text with \n\n paragraphs)
- Exam analytics and leaderboards
- Course discussion forum

### Long-term (12+ months)
- Live class/video streaming integration
- AI-powered question generation
- Multi-instructor support
- Payment gateway: bKash API, Nagad, ShurjoPay, SSLCommerz
- Mobile app (React Native)

---

## 8. Important Files to Know

| File | Purpose |
|------|---------|
| `src/lib/config.ts` | Site name, contact info, social links, bKash number, payment config |
| `src/lib/data.ts` | Static fallback data for courses, exams, books, articles |
| `src/lib/types.ts` | TypeScript types for all database entities |
| `src/lib/firebase.ts` | Firebase initialization and error handling |
| `src/lib/AuthContext.tsx` | Authentication state and user role management |
| `firestore.rules` | Database security rules |
| `firebase-applet-config.json` | Firebase connection configuration |
| `index.html` | Base HTML with SEO meta tags |

---

## 9. Changing the bKash Number

Edit `src/lib/config.ts`:

```typescript
export const BKASH_MANUAL = {
  number: '01XXXXXXXXX',  // ← Change this to your real bKash number
  // ... rest of config
};
```

Then rebuild: `npm run build`

---

## 10. Brand Consistency

- **Brand name:** Mathemzi Edu (NOT "Mathenzi" or any other variant)
- **Tagline:** "Master Mathematics with Logic, Practice & Confidence"
- **Bangla:** "গণিত হোক সহজ, যুক্তিতে হোক শক্তিশালী"
- **Domain:** mathemziedu.com
- **Email:** support@mathemziedu.com

---

## Contact

For technical support, contact the development team.
