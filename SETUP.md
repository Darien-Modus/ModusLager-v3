# Inventory Booking System - Setup Instructions

## 📋 Prerequisites

Make sure you have these installed on your computer:
- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- A code editor like **VS Code** (recommended)

## 🚀 Quick Start

### Step 1: Create Project Structure

Create a new folder and set up this structure:

```
inventory-booking-app/
├── public/
├── src/
│   ├── components/
│   │   ├── ItemsPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── BookingsPage.tsx
│   │   ├── OverviewPage.tsx
│   │   ├── CalendarPage.tsx
│   │   └── ItemIcon.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── helpers.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

### Step 2: Copy All Files

Copy each file I've provided above into the correct location in your project folder.

### Step 3: Install Dependencies

Open your terminal in the project folder and run:

```bash
npm install
```

Or if you use yarn:

```bash
yarn install
```

### Step 4: Run the Development Server

```bash
npm run dev
```

Or with yarn:

```bash
yarn dev
```

The app will automatically open in your browser at `http://localhost:3000`

## 📦 Building for Production

When you're ready to deploy:

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

To preview the production build locally:

```bash
npm run preview
```

## 🗂️ File Descriptions

### Configuration Files
- **package.json** - Project dependencies and scripts
- **vite.config.ts** - Vite bundler configuration
- **tsconfig.json** - TypeScript compiler configuration
- **tailwind.config.js** - Tailwind CSS configuration
- **postcss.config.js** - PostCSS configuration

### Source Files
- **src/main.tsx** - Application entry point
- **src/App.tsx** - Main application component with routing
- **src/index.css** - Global styles and Tailwind directives
- **src/types/index.ts** - TypeScript interfaces
- **src/utils/helpers.ts** - Utility functions
- **src/components/** - All page components

## 🔧 Troubleshooting

### Port Already in Use
If port 3000 is busy, Vite will automatically use the next available port.

### Module Not Found Errors
Make sure you've installed all dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
Check that all files are in the correct locations and restart your IDE.

## 📱 Component Files Still Needed

I'll provide the remaining component files separately. You'll need:
1. ItemsPage.tsx
2. ProjectsPage.tsx
3. BookingsPage.tsx
4. OverviewPage.tsx
5. CalendarPage.tsx

These are ready for you - just let me know when you want them!

## 🌐 Deployment Options

### Vercel (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy automatically

### Netlify
1. Run `npm run build`
2. Drag the `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 💾 Adding a Real Database

Currently, data resets on page refresh. To persist data:

### Option 1: Local Storage (Quick)
Add to App.tsx:
```typescript
useEffect(() => {
  localStorage.setItem('items', JSON.stringify(items));
}, [items]);
```

### Option 2: Firebase (Recommended)
See the detailed backend setup guide in the original instructions.

### Option 3: Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create tables matching the TypeScript interfaces
3. Replace state management with Supabase queries

## 📞 Need Help?

If you encounter issues:
1. Check the console for errors (F12 in browser)
2. Verify all files are in correct locations
3. Make sure Node.js version is 18+
4. Clear browser cache and restart dev server

## ✨ Next Steps

1. Set up a real database (Firebase/Supabase)
2. Add user authentication
3. Implement email notifications
4. Add export/import functionality
5. Create mobile-responsive improvements

Happy coding! 🚀