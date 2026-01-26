# 📦 Inventory Booking System

A modern, full-featured inventory booking and management system built with React, TypeScript, and Tailwind CSS.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0-blue.svg)

## ✨ Features

- 📊 **Live Inventory Overview** - Real-time availability tracking with visual indicators
- 📅 **Calendar View** - Interactive booking calendar with hover details
- 🎨 **Custom Item Icons** - Color-coded or image-based item identification
- 📋 **Multi-Item Bookings** - Book multiple items in a single reservation
- 🔍 **Advanced Filtering** - Filter by items, date ranges, and availability
- 🎯 **Smart Validation** - Prevents overbooking with intelligent availability checks
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🌈 **Modern UI** - Clean, intuitive interface with Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed on your system
- npm or yarn package manager

### Installation

1. **Clone or download this repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 Usage

### Items Management
- Add items with names, quantities, and custom colors/images
- View real-time availability for each item
- Edit or delete existing items

### Projects Management
- Create projects with names, numbers, and client information
- Organize bookings by project
- Track which projects are using which equipment

### Bookings
- Create bookings with multiple items
- Select date ranges for reservations
- System automatically prevents overbooking
- Edit or cancel existing bookings

### Live Inventory Overview
- See all items at a glance
- Filter by specific items
- Check availability for custom date ranges
- Visual indicators show stock levels

### Calendar View
- Month-by-month booking visualization
- Hover over dates to see booking details
- Filter calendar by specific items
- Quick overview of busy periods

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 📁 Project Structure

```
inventory-booking-app/
├── src/
│   ├── components/          # React components
│   │   ├── ItemsPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── BookingsPage.tsx
│   │   ├── OverviewPage.tsx
│   │   ├── CalendarPage.tsx
│   │   └── ItemIcon.tsx
│   ├── types/              # TypeScript interfaces
│   │   └── index.ts
│   ├── utils/              # Helper functions
│   │   └── helpers.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html             # HTML template
└── package.json           # Dependencies
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🚢 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Deploy automatically

### Netlify
1. Run `npm run build`
2. Upload the `dist/` folder to [Netlify](https://netlify.com)

### Other Platforms
The built files in `dist/` can be deployed to any static hosting service.

## 🗄️ Adding a Database

Currently, data is stored in-memory and resets on refresh. To add persistence:

### Option 1: Firebase
- Easy setup with real-time sync
- Built-in authentication
- Free tier available

### Option 2: Supabase
- Open-source Firebase alternative
- PostgreSQL database
- Excellent documentation

### Option 3: Custom Backend
- Build with Node.js/Express
- Use PostgreSQL, MongoDB, or MySQL
- Full control over data

See `SETUP.md` for detailed instructions.

## 🎨 Customization

### Changing Colors
Edit `tailwind.config.js` to customize the color scheme:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
    }
  }
}
```

### Adding Features
The modular structure makes it easy to add new features:
1. Create new components in `src/components/`
2. Add routes in `src/App.tsx`
3. Update types in `src/types/`

## 🐛 Troubleshooting

**Port already in use?**
Vite will automatically use the next available port.

**Build errors?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors?**
Make sure all files are in the correct locations.

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📧 Support

If you need help:
1. Check the `SETUP.md` file
2. Review the code comments
3. Open an issue on GitHub

## 🌟 Roadmap

Future enhancements:
- [ ] User authentication and roles
- [ ] Email notifications
- [ ] Export to PDF/Excel
- [ ] Mobile app version
- [ ] Advanced reporting
- [ ] API integration
- [ ] Barcode scanning

---

Built with ❤️ using React and TypeScript