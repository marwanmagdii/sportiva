import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    signInAnonymously,
    signInWithCustomToken
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    getDocs, 
    addDoc,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';

// --- MOCK DATA OVERHAUL & ENHANCEMENT ---
const mockFields = [
    { id: 'f1', name: 'Nasr City Stadium', city: 'Cairo', district: 'Nasr City', price: 300, image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1935&auto=format&fit=crop', rating: 4.8, description: 'State-of-the-art 5-a-side football pitches with premium turf. Perfect for evening matches.', reviews: [{author: 'Ahmed M.', rating: 5, text: 'Best pitch in Nasr City! Great turf and lights.'}], amenities: { ball: 'rental', shirts: 'rental', water: true, showers: true, toilets: true }, ballPrice: 30, shirtsPrice: 50 },
    { id: 'f2', name: 'Mohandessin Football Park', city: 'Giza', district: 'Mohandessin', price: 350, image: 'https://images.unsplash.com/photo-1551955139-01c353b0d37c?q=80&w=2070&auto=format&fit=crop', rating: 4.7, description: 'Historic club with well-maintained grounds. Ideal for both competitive games and casual kickabouts.', reviews: [{author: 'Youssef A.', rating: 5, text: 'Classic spot, always a great experience.'}], amenities: { ball: 'free', shirts: 'rental', water: true, showers: false, toilets: true }, ballPrice: 0, shirtsPrice: 50 },
    { id: 'f3', name: 'Maadi Sports Club', city: 'Cairo', district: 'Maadi', price: 320, image: 'https://images.unsplash.com/photo-1526203303979-5a1e847a2569?q=80&w=2070&auto=format&fit=crop', rating: 4.6, description: 'Family-friendly club with multiple football fields suitable for all ages. A great place for a weekend game.', reviews: [{author: 'Layla G.', rating: 4, text: 'Courts are great, but can get busy.'}], amenities: { ball: 'none', shirts: 'none', water: false, showers: true, toilets: true }, ballPrice: 0, shirtsPrice: 0 },
    { id: 'f4', name: 'Zamalek Club Pitch 5', city: 'Giza', district: 'Zamalek', price: 400, image: 'https://images.unsplash.com/photo-1527090440332-96f5a315b4a0?q=80&w=2070&auto=format&fit=crop', rating: 4.9, description: 'Professional grade pitch, home to many local league matches.', reviews: [{author: 'Fady', rating: 5, text: 'Best turf in Giza.'}], amenities: { ball: 'free', shirts: 'rental', water: true, showers: true, toilets: true }, ballPrice: 0, shirtsPrice: 60 },
];

const mockChallenges = [
    { id: 'c1', type: 'challenge', teamName: 'Cairo Lions', skill: 'Intermediate', city: 'Cairo', district: 'Nasr City', details: 'Looking for a friendly 5v5 match this Thursday evening. Any intermediate team is welcome to challenge us!', image: 'https://images.unsplash.com/photo-1565929402501-19d4e9f85523?q=80&w=1934&auto=format&fit=crop' },
    { id: 't1', type: 'tournament', name: 'Giza Ramadan League', sport: 'Football', slots: '8/16 Teams', image: 'https://images.unsplash.com/photo-1628891885603-315318d53a29?q=80&w=2070&auto=format&fit=crop', city: 'Giza', district: '6th of October', details: 'Annual Ramadan tournament. Knockout format. Prizes for the top 3 teams.' },
    { id: 'c2', type: 'challenge', teamName: 'Zamalek Legends', skill: 'Advanced', city: 'Giza', district: 'Zamalek', details: 'Highly competitive team seeking a challenge against other advanced squads. Friday night.', image: 'https://images.unsplash.com/photo-1599299650169-3424d515a0f3?q=80&w=1974&auto=format&fit=crop' },
];

const mockProducts = [
    { id: 'p1', name: 'Predator Pro Cleats', price: 1200, category: 'Shoes', image: 'https://images.unsplash.com/photo-1608231387042-66d16dea626b?q=80&w=2070&auto=format&fit=crop', description: 'Engineered for precision and power. The Predator Pro offers maximum grip and ball control.', reviews: [{author: 'Hassan', rating: 5, text: 'Amazing grip, feels great on the ball.'}] },
    { id: 'p2', name: 'Egypt National Team Jersey', price: 800, category: 'Clothes', image: 'https://images.unsplash.com/photo-1594488542098-9a379a55241f?q=80&w=1974&auto=format&fit=crop', description: 'Official 2025 home jersey. Breathable, lightweight fabric with Dri-FIT technology.', reviews: [{author: 'Mariam', rating: 5, text: 'Authentic and very comfortable.'}] },
    { id: 'p3', name: 'Pro Shin Guards', price: 350, category: 'Accessories', image: 'https://images.unsplash.com/photo-16082292452292-838834664659?q=80&w=2070&auto=format&fit=crop', description: 'Tough shell with foam backing for excellent impact absorption and comfort.', reviews: [] },
    { id: 'p4', name: 'Official League Ball', price: 600, category: 'Accessories', image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1935&auto=format&fit=crop', description: 'FIFA Quality Pro certified match ball. Perfect for all weather conditions.', reviews: [] },
];

const mockPlayers = [
    { id: 'pl1', name: 'Ali Hassan', position: 'Forward', skill: 'Advanced', city: 'Cairo', district: 'Nasr City', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1974&auto=format&fit=crop' },
    { id: 'pl2', name: 'Omar Sherif', position: 'Midfielder', skill: 'Intermediate', city: 'Cairo', district: 'Maadi', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop' },
    { id: 'pl3', name: 'Karim Ahmed', position: 'Defender', skill: 'Beginner', city: 'Cairo', district: 'Heliopolis', image: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?q=80&w=1974&auto=format&fit=crop' },
    { id: 'pl4', name: 'Nour El-Sayed', position: 'Goalkeeper', skill: 'Intermediate', city: 'Giza', district: 'Zamalek', image: 'https://images.unsplash.com/photo-1522529599102-4b324d55b322?q=80&w=1974&auto=format&fit=crop' },
];

const mockTeams = [
    { id: 'tm1', name: 'Maadi Mavericks', skill: 'Intermediate', lookingFor: 'Goalkeeper', city: 'Cairo', district: 'Maadi', image: 'https://images.unsplash.com/photo-1517649763984-42d56cec6758?q=80&w=2070&auto=format&fit=crop', members: mockPlayers.slice(0,2) },
    { id: 'tm2', name: 'Giza Pyramids FC', skill: 'Advanced', lookingFor: 'Open to challenges', city: 'Giza', district: 'Mohandessin', image: 'https://images.unsplash.com/photo-1595507994342-82a65f04895e?q=80&w=2070&auto=format&fit=crop', members: [mockPlayers[2]] },
    { id: 'tm3', name: 'Heliopolis Eagles', skill: 'Beginner', lookingFor: 'Defender, Midfielder', city: 'Cairo', district: 'Heliopolis', image: 'https://images.unsplash.com/photo-1575361204480-aadea2503aa4?q=80&w=2070&auto=format&fit=crop', members: [mockPlayers[3]] },
];

const allDistrictsList = {
    "Cairo": ["Nasr City", "Maadi", "Heliopolis", "New Cairo", "Downtown", "Shubra", "Ain Shams", "El Marg", "El Matareya", "Zeitoun", "Basateen"],
    "Giza": ["Mohandessin", "Zamalek", "Dokki", "Agouza", "6th of October", "Sheikh Zayed", "Haram", "Faisal", "Imbaba", "Bulaq ad Dakrur"]
};


// --- FIREBASE CONFIGURATION ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- HELPER & UI COMPONENTS ---
const Spinner = () => <div className="flex justify-center items-center p-8"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600"></div></div>;
const StarRating = ({ rating, setRating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <svg key={i} onClick={() => setRating && setRating(i + 1)} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'} ${setRating ? 'cursor-pointer' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
        ))}
    </div>
);
const ReviewForm = ({ onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating > 0 && text) {
            onSubmit({ rating, text, author: 'You' });
            setRating(0);
            setText('');
        }
    };
    return (
        <form onSubmit={handleSubmit} className="border-t pt-6 mt-6">
            <h3 className="text-xl font-bold mb-4">Write a Review</h3>
            <div className="mb-4"><p className="font-semibold mb-2">Your Rating:</p><StarRating rating={rating} setRating={setRating} /></div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Share your experience..." className="w-full p-2 border rounded-lg h-24 mb-4"></textarea>
            <button type="submit" className="bg-emerald-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-emerald-700 transition">Submit Review</button>
        </form>
    );
};
const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative p-8 text-center" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-2 right-4 text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
            {children}
        </div>
    </div>
);
const AmenityListItem = ({ text, available }) => {
    if (!available) return null;
    return (
        <li className="flex items-center space-x-3">
            <svg className="w-6 h-6 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-800">{text}</span>
        </li>
    );
};


// --- PAGE COMPONENTS ---

const Header = ({ page, setPage, user, onSignOut }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navItems = ['Fields', 'Community', 'Challenges', 'Marketplace', 'About Us'];
    const NavLink = ({ name }) => (
        <button onClick={() => setPage(name.toLowerCase().replace(' ', ''))} className="relative text-gray-600 hover:text-emerald-600 transition group py-2">
            {name}
            <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 transform transition-transform duration-300 ${page === name.toLowerCase().replace(' ', '') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
        </button>
    );
    return (
        <header className="bg-white shadow-sm sticky top-0 z-40">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <button onClick={() => setPage('home')} className="text-3xl font-bold text-emerald-600">Sportiva</button>
                <div className="hidden md:flex items-center space-x-8">
                    {navItems.map(item => <NavLink key={item} name={item} />)}
                    {user && <NavLink name="Dashboard" />}
                </div>
                <div className="hidden md:flex items-center space-x-4">
                    {user ? <button onClick={onSignOut} className="bg-gray-200 text-gray-800 font-semibold px-5 py-2 rounded-lg hover:bg-gray-300 transition">Sign Out</button> : <button onClick={() => setPage('auth')} className="bg-emerald-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-emerald-700 transition">Login</button>}
                </div>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-gray-700 focus:outline-none"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg></button>
            </nav>
            {isMenuOpen && <div className="md:hidden px-6 pb-4">...mobile menu logic...</div>}
        </header>
    );
};

const Footer = ({ setPage }) => (
    <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-6 py-12">
             <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Sportiva</h3>
                    <p className="text-gray-400">Connecting players and venues across Egypt.</p>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                    <ul className="space-y-2">
                        <li><button onClick={() => setPage('home')} className="text-gray-400 hover:text-white">Home</button></li>
                        <li><button onClick={() => setPage('fields')} className="text-gray-400 hover:text-white">Book a Field</button></li>
                        <li><button onClick={() => setPage('community')} className="text-gray-400 hover:text-white">Community</button></li>
                        <li><button onClick={() => setPage('aboutus')} className="text-gray-400 hover:text-white">About Us</button></li>
                    </ul>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Follow Us</h3>
                    {/* Add social media icons here */}
                </div>
            </div>
            <div className="mt-8 border-t border-gray-700 pt-6 text-center text-gray-500 text-sm"><p>&copy; {new Date().getFullYear()} Sportiva. All Rights Reserved.</p></div>
        </div>
    </footer>
);


const HomePage = ({ setPage, onSelectField }) => {
    const featuredFields = mockFields.slice(0, 3);
    return (
    <div>
        <section className="relative text-white bg-cover bg-center h-[60vh] md:h-[80vh] flex items-center justify-center" style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://images.unsplash.com/photo-1551955139-01c353b0d37c?q=80&w=2070&auto=format&fit=crop')" }}>
            <div className="container mx-auto px-6 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4 animate-fade-in-down">The Easiest Way to Book Football Fields in Egypt</h1>
                <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-8 animate-fade-in-up">Find available fields, challenge teams, and join the community.</p>
                <div className="mt-8 max-w-2xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-2 bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                        <input type="text" placeholder="Search by field name or district..." className="w-full p-3 text-gray-800 rounded-md focus:ring-2 focus:ring-emerald-400 outline-none" />
                        <button onClick={() => setPage('fields')} className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-md text-lg hover:bg-emerald-700 transition-transform transform hover:scale-105">Search</button>
                    </div>
                </div>
            </div>
        </section>
        
        {/* NEW: What is Sportiva Section */}
        <section className="py-20 bg-white">
            <div className="container mx-auto px-6 text-center">
                 <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">What is Sportiva?</h2>
                 <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Sportiva is a SportsTech company operating in the digital sports services and marketplace domain. We offer a comprehensive platform that connects players and sports facility owners across Egypt, simplifying the process of booking, managing, and engaging with the sports community.
                 </p>
                 <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
                     <div className="p-6 bg-gray-50 rounded-lg">
                        <h3 className="text-xl font-semibold text-emerald-600 mb-2">Instant Booking</h3>
                        <p className="text-gray-600">Find and reserve sports fields with real-time slot visibility.</p>
                     </div>
                      <div className="p-6 bg-gray-50 rounded-lg">
                        <h3 className="text-xl font-semibold text-emerald-600 mb-2">Player Community</h3>
                        <p className="text-gray-600">Connect with others to find games, join teams, or create tournaments.</p>
                     </div>
                      <div className="p-6 bg-gray-50 rounded-lg">
                        <h3 className="text-xl font-semibold text-emerald-600 mb-2">Field Management</h3>
                        <p className="text-gray-600">A dashboard for owners to list availability, handle bookings, and run promotions.</p>
                     </div>
                      <div className="p-6 bg-gray-50 rounded-lg">
                        <h3 className="text-xl font-semibold text-emerald-600 mb-2">Sports Marketplace</h3>
                        <p className="text-gray-600">An in-app shop for gear, offering a targeted sales channel for local vendors.</p>
                     </div>
                 </div>
            </div>
        </section>

        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800">How It Works</h2>
                    <p className="text-lg text-gray-500 mt-2">Your game is just a few clicks away.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-10 text-center">
                    <div className="p-6">
                        <div className="flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-4"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div>
                        <h3 className="text-xl font-semibold mb-2">1. Find Your Pitch</h3><p className="text-gray-600">Use our advanced filters to find the perfect field based on location, price, and rating.</p>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-4"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>
                        <h3 className="text-xl font-semibold mb-2">2. Book Instantly</h3><p className="text-gray-600">Select your desired time slot and confirm your booking with secure online payment.</p>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-4"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.834 9.168-4.418"></path></svg></div>
                        <h3 className="text-xl font-semibold mb-2">3. Just Play!</h3><p className="text-gray-600">Show up at the field at your booked time. We handle the rest. It's that simple.</p>
                    </div>
                </div>
            </div>
        </section>

        <section className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Featured Fields</h2>
                    <p className="text-lg text-gray-500 mt-2">Check out some of our top-rated pitches.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuredFields.map(field => (
                        <div key={field.id} onClick={() => onSelectField(field)} className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow group">
                            <div className="overflow-hidden h-48 relative">
                                <img src={field.image} alt={field.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute top-2 right-2 bg-emerald-600 text-white text-sm font-bold px-3 py-1 rounded-full">{field.rating} ★</div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{field.name}</h3>
                                <p className="text-gray-600">{field.district}, {field.city}</p>
                                <p className="text-lg font-semibold text-emerald-600 mt-4">EGP {field.price}/hr</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
        
        <section className="relative text-white bg-cover bg-center py-24" style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1544329388-2333b8a1a47b?q=80&w=2070&auto=format&fit=crop')" }}>
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">Join The Largest Football Community</h2>
                <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-8">Find players, join teams, or create challenges. Your next match is waiting.</p>
                <div className="flex flex-col md:flex-row justify-center gap-4">
                    <button onClick={() => setPage('community')} className="bg-white text-emerald-700 font-bold px-8 py-3 rounded-lg text-lg hover:bg-gray-100 transition-transform transform hover:scale-105">Find Players & Teams</button>
                    <button onClick={() => setPage('challenges')} className="bg-transparent border-2 border-white text-white font-bold px-8 py-3 rounded-lg text-lg hover:bg-white hover:text-emerald-700 transition-colors">View Challenges</button>
                </div>
            </div>
        </section>
    </div>
);
};

// NEW: About Us Page
const AboutUsPage = () => {
    const team = [
        { name: 'Marwan Magdy', title: 'Chief Executive Officer', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop', bio: 'Marwan holds a B.Sc. in Computer Science and brings three years of technology and startup experience. He defines the commercial roadmap, oversees key partnerships, and guides the company\'s vision to drive sustainable growth.' },
        { name: 'Pero Alpert', title: 'Chief Technology Officer', image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=2070&auto=format&fit=crop', bio: 'Pero holds a B.Sc. in Computer Science and brings eight years of hands-on mobile development experience. He defines the technical vision, oversees all product architecture, and manages the engineering team.' },
        { name: 'Moktar Erfan', title: 'Chief Operating Officer', image: 'https://images.unsplash.com/photo-1627541594242-ac3174ee03d4?q=80&w=1974&auto=format&fit=crop', bio: 'Moktar holds a B.Sc. in Computer Science and focuses on building operational processes, user onboarding, support workflows, and coordinating early outreach to field owners and users.' }
    ];

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="relative bg-gray-800 text-white py-24 px-6 text-center">
                 <div className="absolute inset-0">
                    <img src="https://images.unsplash.com/photo-1517649763984-42d56cec6758?q=80&w=2070&auto=format&fit=crop" alt="Team celebrating" className="w-full h-full object-cover opacity-30"/>
                </div>
                <div className="relative">
                    <h1 className="text-4xl md:text-5xl font-extrabold">About Sportiva</h1>
                    <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto">We're revolutionizing recreational sports in Egypt by connecting players, teams, and venues like never before.</p>
                </div>
            </section>

            {/* Our Mission Section */}
            <section className="py-20 px-6">
                <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Mission</h2>
                        <p className="text-gray-600 text-lg leading-relaxed mb-6">
                           To be the most trusted and widely used app for booking sports facilities across Egypt. We aim to help field owners increase their income by filling more booking slots and build a strong, vibrant sports community where players can easily find games and teammates.
                        </p>
                        <div className="space-y-4">
                           <div className="flex items-start">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">1</div>
                                <p className="ml-4 text-gray-700">Simplify the booking process with instant, real-time availability and secure mobile payments.</p>
                           </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">2</div>
                                <p className="ml-4 text-gray-700">Empower facility owners with digital tools to manage their spaces efficiently and maximize revenue.</p>
                           </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">3</div>
                                <p className="ml-4 text-gray-700">Foster a connected community for players to find teams, challenge opponents, and share their passion for sports.</p>
                           </div>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <img src="https://images.unsplash.com/photo-1575361204480-aadea2503aa4?q=80&w=2070&auto=format&fit=crop" alt="Football players huddle" className="rounded-lg shadow-xl"/>
                    </div>
                </div>
            </section>
            
            {/* Meet the Team Section */}
            <section className="bg-gray-50 py-20 px-6">
                <div className="container mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Meet the Team</h2>
                    <p className="text-lg text-gray-600 mt-2 mb-12">The minds behind the mission.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {team.map((member) => (
                            <div key={member.name} className="bg-white rounded-lg shadow-lg p-6 transform hover:-translate-y-2 transition-transform duration-300">
                                <img className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-emerald-200" src={member.image} alt={member.name} />
                                <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                                <p className="text-emerald-600 font-semibold mb-3">{member.title}</p>
                                <p className="text-gray-600 text-sm">{member.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};


const FieldDetailsPage = ({ field, setPage, onBook }) => {
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [reviews, setReviews] = useState(field.reviews);
    const [rentBall, setRentBall] = useState(false);
    const [rentShirts, setRentShirts] = useState(false);

    const basePrice = selectedSlots.length * field.price;
    const ballCost = rentBall && field.amenities.ball === 'rental' ? field.ballPrice : 0;
    const shirtsCost = rentShirts && field.amenities.shirts === 'rental' ? field.shirtsPrice : 0;
    const totalPrice = basePrice + ballCost + shirtsCost;

    const timeSlots = Array.from({ length: 6 }, (_, i) => i + 17).map(hour => ({ start: hour, display: `${hour % 12 === 0 ? 12 : hour % 12}:00 PM - ${(hour + 1) % 12 === 0 ? 12 : (hour + 1) % 12}:00 PM` }));
    const handleSlotClick = (slot) => setSelectedSlots(prev => prev.some(s => s.start === slot.start) ? prev.filter(s => s.start !== slot.start) : [...prev, slot].sort((a, b) => a.start - b.start));
    const handleAddReview = (review) => setReviews(prev => [...prev, review]);

    const bookingData = {
        field,
        selectedSlots,
        totalPrice,
        hours: selectedSlots.length
    };

    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={() => setPage('fields')} className="mb-8 text-emerald-600 hover:text-emerald-800">← Back to Fields</button>
            <div className="grid md:grid-cols-5 gap-12">
                <div className="md:col-span-3">
                    <img src={field.image} alt={field.name} className="w-full h-96 object-cover rounded-lg shadow-lg" />
                    <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold mb-4">We Offer</h2>
                        <ul className="space-y-3 text-lg">
                            <AmenityListItem available={field.amenities.toilets} text="Toilets" />
                            <AmenityListItem available={field.amenities.showers} text="Showers" />
                            <AmenityListItem available={field.amenities.water} text="Water for Sale" />
                        </ul>
                    </div>
                    <div className="mt-8"><h2 className="text-2xl font-bold mb-4">Reviews</h2><div className="space-y-6">{reviews.map((r, i) => <div key={i} className="border-t pt-4"><div className="flex items-center mb-2"><p className="font-bold mr-4">{r.author}</p><StarRating rating={r.rating} /></div><p>{r.text}</p></div>)}</div><ReviewForm onSubmit={handleAddReview} /></div>
                </div>
                <div className="md:col-span-2"><div className="bg-white p-6 rounded-lg shadow-lg sticky top-24">
                    <h1 className="text-3xl font-bold mb-2">{field.name}</h1>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(field.district + ", " + field.city)}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 text-lg mb-4 hover:text-emerald-600 transition flex items-center"><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{field.district}, {field.city}</a>
                    <div className="my-4"><StarRating rating={field.rating} /></div>
                    
                    <div className="space-y-2 my-4">
                        {field.amenities.ball === 'free' && <p className="text-emerald-600 font-semibold">✓ Ball for free</p>}
                        {field.amenities.ball === 'rental' && <div className="flex items-center"><input type="checkbox" id="rentBall" checked={rentBall} onChange={(e) => setRentBall(e.target.checked)} className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" /><label htmlFor="rentBall" className="ml-2 text-gray-700">Rent a ball (+{field.ballPrice} EGP)</label></div>}
                        {field.amenities.ball === 'none' && <p className="text-gray-500">✗ No ball available</p>}
                        
                        {field.amenities.shirts === 'rental' && <div className="flex items-center"><input type="checkbox" id="rentShirts" checked={rentShirts} onChange={(e) => setRentShirts(e.target.checked)} className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" /><label htmlFor="rentShirts" className="ml-2 text-gray-700">Rent shirts (+{field.shirtsPrice} EGP)</label></div>}
                    </div>

                    <p className="font-semibold mb-2 mt-4">Select Hours:</p>
                    <div className="grid grid-cols-2 gap-2 mb-4">{timeSlots.map(slot => <button key={slot.start} onClick={() => handleSlotClick(slot)} className={`p-2 rounded-lg border-2 text-sm ${selectedSlots.some(s => s.start === slot.start) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:border-emerald-500'}`}>{slot.display}</button>)}</div>
                    <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between items-center text-xl font-bold">
                            <p>Total Price:</p>
                            <p>EGP {totalPrice}</p>
                        </div>
                        <button onClick={() => onBook(bookingData)} className="mt-4 w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50" disabled={selectedSlots.length === 0}>
                            Book Now ({selectedSlots.length} hr)
                        </button>
                        <p className="text-center text-sm text-gray-500 mt-2">
                            You can pay a 25% deposit now and the rest at the venue.
                        </p>
                    </div>
                </div></div>
            </div>
        </div>
    );
};

const ProductDetailsPage = ({ product, setPage }) => {
    const [reviews, setReviews] = useState(product.reviews);
    const handleAddReview = (review) => setReviews(prev => [...prev, review]);
    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={() => setPage('marketplace')} className="mb-8 text-emerald-600 hover:text-emerald-800">← Back to Marketplace</button>
            <div className="grid md:grid-cols-2 gap-12">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg shadow-lg" />
                <div>
                    <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
                    <p className="text-2xl font-bold text-emerald-600 mb-6">EGP {product.price}</p>
                    <p className="text-gray-700 leading-relaxed mb-6">{product.description}</p>
                    <button className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition">Add to Cart</button>
                    <div className="mt-8"><h2 className="text-2xl font-bold mb-4">Reviews</h2><div className="space-y-6">{reviews.map((r, i) => <div key={i} className="border-t pt-4"><div className="flex items-center mb-2"><p className="font-bold mr-4">{r.author}</p><StarRating rating={r.rating} /></div><p>{r.text}</p></div>)}</div><ReviewForm onSubmit={handleAddReview} /></div>
                </div>
            </div>
        </div>
    );
};

// --- ENHANCED PAGES ---

const MarketplacePage = ({ onSelectProduct }) => {
    const [filteredProducts, setFilteredProducts] = useState(mockProducts);
    const [filters, setFilters] = useState({ term: '', categories: [], minPrice: '', maxPrice: '' });
    const [showFilters, setShowFilters] = useState(false);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (e) => {
        const { value, checked } = e.target;
        setFilters(prev => {
            const newCategories = checked 
                ? [...prev.categories, value] 
                : prev.categories.filter(c => c !== value);
            return { ...prev, categories: newCategories };
        });
    };
    
    const applyFilters = () => {
        let result = mockProducts.filter(p => p.name.toLowerCase().includes(filters.term.toLowerCase()));
        
        if (filters.categories.length > 0) {
            result = result.filter(p => filters.categories.includes(p.category));
        }

        if (filters.minPrice) {
            result = result.filter(p => p.price >= Number(filters.minPrice));
        }

        if (filters.maxPrice) {
            result = result.filter(p => p.price <= Number(filters.maxPrice));
        }
        
        setFilteredProducts(result);
        if(window.innerWidth < 1024) setShowFilters(false);
    };

    const resetFilters = () => {
        setFilters({ term: '', categories: [], minPrice: '', maxPrice: '' });
        setFilteredProducts(mockProducts);
        if(window.innerWidth < 1024) setShowFilters(false);
    };

    const FilterSidebar = () => (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Filters</h3>
            <div className="space-y-6">
                <div>
                    <label className="font-semibold text-gray-700">Budget (EGP)</label>
                    <div className="flex items-center gap-2 mt-2">
                        <input type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="Min" className="w-full p-2 border rounded-md" />
                        <span>-</span>
                        <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Max" className="w-full p-2 border rounded-md" />
                    </div>
                </div>
                <div>
                    <label className="font-semibold text-gray-700">Category</label>
                    <div className="space-y-2 mt-2">
                        {['Shoes', 'Clothes', 'Accessories'].map(cat => (
                            <label key={cat} className="flex items-center">
                                <input type="checkbox" value={cat} checked={filters.categories.includes(cat)} onChange={handleCategoryChange} className="h-4 w-4 text-emerald-600 border-gray-300 rounded" />
                                <span className="ml-2 text-gray-700">{cat}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={resetFilters} className="w-full bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg hover:bg-gray-300">Reset</button>
                    <button onClick={applyFilters} className="w-full bg-emerald-600 text-white font-semibold py-2 rounded-lg hover:bg-emerald-700">Apply</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-50">
            <div className="container mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Marketplace</h1>
                    <p className="text-lg text-gray-600 mt-2">Find the perfect gear to elevate your game.</p>
                </div>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Desktop Filters */}
                    <div className="hidden lg:block lg:col-span-1">
                        <FilterSidebar />
                    </div>

                    {/* Mobile Filters */}
                    <div className="lg:hidden col-span-4">
                        <input name="term" value={filters.term} onChange={handleFilterChange} placeholder="Search for gear..." className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-emerald-500 mb-4 shadow-sm" />
                        <button onClick={() => setShowFilters(!showFilters)} className="w-full bg-white p-3 rounded-lg shadow-md flex justify-between items-center">
                            <span className="font-semibold">Advanced Filters</span>
                            <svg className={`w-5 h-5 transition-transform ${showFilters ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        {showFilters && <div className="mt-4"><FilterSidebar /></div>}
                    </div>

                    {/* Products Grid */}
                    <div className="lg:col-span-3">
                         <div className="hidden lg:block">
                            <input name="term" value={filters.term} onChange={handleFilterChange} placeholder="Search for gear..." className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-emerald-500 mb-8 shadow-sm" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                            {filteredProducts.map(p => (
                                <div key={p.id} onClick={() => onSelectProduct(p)} className="bg-white rounded-lg shadow-md overflow-hidden group cursor-pointer transform hover:-translate-y-1 transition-transform">
                                    <div className="overflow-hidden h-64">
                                        <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                    <div className="p-4 flex flex-col">
                                        <h3 className="text-lg font-bold text-gray-800 truncate">{p.name}</h3>
                                        <p className="text-sm text-gray-500">{p.category}</p>
                                        <div className="flex justify-between items-center mt-4">
                                            <span className="text-xl font-semibold text-emerald-600">EGP {p.price}</span>
                                            <button className="bg-emerald-100 text-emerald-800 font-semibold px-4 py-1 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors text-sm">View</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChallengesPage = ({ onAction }) => {
    const [filteredChallenges, setFilteredChallenges] = useState(mockChallenges);
    const [filters, setFilters] = useState({ term: '', types: [], skills: [], city: 'All', districts: [] });
    const [districtSearch, setDistrictSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);

    const allCities = [...new Set(mockChallenges.map(c => c.city))];
    const allDistricts = allDistrictsList[filters.city] || [];

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'types' || name === 'skills' || name === 'districts') {
            setFilters(prev => ({
                ...prev,
                [name]: checked ? [...prev[name], value] : prev[name].filter(v => v !== value)
            }));
        } else if (name === 'city') {
             setFilters(prev => ({ ...prev, city: value, districts: [] }));
        }
        else {
             setFilters(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const applyFilters = () => {
        let result = mockChallenges.filter(c => 
            (c.name || c.teamName).toLowerCase().includes(filters.term.toLowerCase())
        );
        if (filters.types.length > 0) {
            result = result.filter(c => filters.types.includes(c.type));
        }
        if (filters.skills.length > 0) {
            result = result.filter(c => filters.skills.includes(c.skill));
        }
        if (filters.city !== 'All') {
            result = result.filter(c => c.city === filters.city);
        }
        if (filters.districts.length > 0) {
            result = result.filter(c => filters.districts.includes(c.district));
        }
        setFilteredChallenges(result);
        if(window.innerWidth < 1024) setShowFilters(false);
    };

    const resetFilters = () => {
        setFilters({ term: '', types: [], skills: [], city: 'All', districts: [] });
        setDistrictSearch('');
        setFilteredChallenges(mockChallenges);
        if(window.innerWidth < 1024) setShowFilters(false);
    };
    
    const FilterSidebar = () => (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Filters</h3>
            <div className="space-y-6">
                <div>
                    <label className="font-semibold text-gray-700">Type</label>
                    <div className="space-y-2 mt-2">
                        <label className="flex items-center"><input type="checkbox" name="types" value="challenge" checked={filters.types.includes('challenge')} onChange={handleFilterChange} className="h-4 w-4 text-emerald-600 rounded" /><span className="ml-2">Challenge</span></label>
                        <label className="flex items-center"><input type="checkbox" name="types" value="tournament" checked={filters.types.includes('tournament')} onChange={handleFilterChange} className="h-4 w-4 text-emerald-600 rounded" /><span className="ml-2">Tournament</span></label>
                    </div>
                </div>
                <div>
                    <label className="font-semibold text-gray-700">Skill Level</label>
                    <div className="space-y-2 mt-2">
                        {['Beginner', 'Intermediate', 'Advanced'].map(skill => (
                            <label key={skill} className="flex items-center"><input type="checkbox" name="skills" value={skill} checked={filters.skills.includes(skill)} onChange={handleFilterChange} className="h-4 w-4 text-emerald-600 rounded" /><span className="ml-2">{skill}</span></label>
                        ))}
                    </div>
                </div>
                 <div>
                    <label htmlFor="city" className="font-semibold text-gray-700">City</label>
                    <select id="city" name="city" value={filters.city} onChange={handleFilterChange} className="w-full p-2 border rounded-md mt-2">
                        <option value="All">All Cities</option>
                        {allCities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                </div>
                 <div className="relative">
                    <label className="font-semibold text-gray-700">District</label>
                    <button onClick={() => setIsDistrictDropdownOpen(!isDistrictDropdownOpen)} className="w-full text-left p-2 border rounded-md mt-2 flex justify-between items-center" disabled={filters.city === 'All'}>
                        <span>{filters.districts.length > 0 ? `${filters.districts.length} selected` : 'Select districts...'}</span>
                        <svg className={`w-5 h-5 transition-transform ${isDistrictDropdownOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    {isDistrictDropdownOpen && (
                        <div className="absolute w-full bg-white border rounded-md shadow-lg mt-1 p-2 z-10">
                            <input type="text" placeholder="Search districts..." value={districtSearch} onChange={(e) => setDistrictSearch(e.target.value)} className="w-full p-2 border rounded-md" />
                            <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                                {allDistricts.filter(d => d.toLowerCase().includes(districtSearch.toLowerCase())).map(district => (
                                    <label key={district} className="flex items-center p-1 rounded hover:bg-gray-100">
                                        <input type="checkbox" name="districts" value={district} checked={filters.districts.includes(district)} onChange={handleFilterChange} className="h-4 w-4 text-emerald-600 rounded" />
                                        <span className="ml-2">{district}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <button onClick={resetFilters} className="w-full bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg hover:bg-gray-300">Reset</button>
                    <button onClick={applyFilters} className="w-full bg-emerald-600 text-white font-semibold py-2 rounded-lg hover:bg-emerald-700">Apply</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-100">
            <div className="relative bg-gray-900 text-white py-24 px-6 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Teammates planning a strategy" />
                <div className="relative container mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Face the Competition</h1>
                    <p className="text-lg text-gray-200 mt-3 max-w-2xl mx-auto">Step up, challenge the best, and compete for glory in local tournaments.</p>
                </div>
            </div>

            <div className="container mx-auto px-6 py-16">
                <div className="grid lg:grid-cols-4 gap-8">
                    <div className="hidden lg:block lg:col-span-1">
                        <FilterSidebar />
                    </div>
                    
                     <div className="lg:hidden col-span-4">
                        <input name="term" value={filters.term} onChange={handleFilterChange} placeholder="Search challenge or tournament..." className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-emerald-500 mb-4 shadow-sm" />
                        <button onClick={() => setShowFilters(!showFilters)} className="w-full bg-white p-3 rounded-lg shadow-md flex justify-between items-center">
                            <span className="font-semibold">Advanced Filters</span>
                            <svg className={`w-5 h-5 transition-transform ${showFilters ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        {showFilters && <div className="mt-4"><FilterSidebar /></div>}
                    </div>

                    <div className="lg:col-span-3">
                         <div className="hidden lg:block">
                            <input name="term" value={filters.term} onChange={handleFilterChange} placeholder="Search challenge or tournament..." className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-emerald-500 mb-8 shadow-sm" />
                        </div>
                        <div className="grid md:grid-cols-1 xl:grid-cols-2 gap-10">
                            {filteredChallenges.map(c => (
                                <div key={c.id} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 flex flex-col group">
                                    <div className="relative">
                                        <img src={c.image} alt={c.name || c.teamName} className="w-full h-56 object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <div className="absolute bottom-4 left-4">
                                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold text-white ${c.type === 'tournament' ? 'bg-blue-600' : 'bg-yellow-500'}`}>{c.type === 'tournament' ? 'Tournament' : 'Challenge'}</span>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-grow flex flex-col">
                                        <h3 className="text-2xl font-bold text-gray-900">{c.name || c.teamName}</h3>
                                        <div className="flex items-center text-gray-500 mt-2 gap-4 text-sm">
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                                {c.district}, {c.city}
                                            </span>
                                            {c.slots && (
                                                 <span className="flex items-center gap-1.5">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                                                    {c.slots}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-4 flex-grow text-gray-700">{c.details}</p>
                                        <div className="mt-6">
                                            <button onClick={() => onAction(c.type === 'tournament' ? 'register' : 'accept_challenge', c)} className="w-full bg-emerald-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-emerald-700 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-200">
                                                {c.type === 'tournament' ? 'Register Your Team' : 'Accept Challenge'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CommunityPage = ({ onAction }) => {
    const [view, setView] = useState('players');
    const [filteredPlayers, setFilteredPlayers] = useState(mockPlayers);
    const [filteredTeams, setFilteredTeams] = useState(mockTeams);
    const [filters, setFilters] = useState({ term: '', city: 'All', districts: [], skill: 'All', position: 'All' });
    const [districtSearch, setDistrictSearch] = useState('');
    const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const allCities = [...new Set([...mockPlayers, ...mockTeams].map(item => item.city))];
    const allDistricts = allDistrictsList[filters.city] || [];

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'districts') {
            setFilters(prev => ({
                ...prev,
                districts: checked ? [...prev.districts, value] : prev.districts.filter(d => d !== value)
            }));
        } else if (name === 'city') {
             setFilters(prev => ({ ...prev, city: value, districts: [] }));
        }
        else {
            setFilters(prev => ({ ...prev, [name]: value }));
        }
    };

    const applyFilters = () => {
        // Player Filtering
        let players = mockPlayers.filter(p => p.name.toLowerCase().includes(filters.term.toLowerCase()));
        if (filters.city !== 'All') players = players.filter(p => p.city === filters.city);
        if (filters.districts.length > 0) players = players.filter(p => filters.districts.includes(p.district));
        if (filters.skill !== 'All') players = players.filter(p => p.skill === filters.skill);
        if (filters.position !== 'All') players = players.filter(p => p.position === filters.position);
        setFilteredPlayers(players);

        // Team Filtering
        let teams = mockTeams.filter(t => t.name.toLowerCase().includes(filters.term.toLowerCase()));
        if (filters.city !== 'All') teams = teams.filter(t => t.city === filters.city);
        if (filters.districts.length > 0) teams = teams.filter(t => filters.districts.includes(t.district));
        if (filters.skill !== 'All') teams = teams.filter(t => t.skill === filters.skill);
        setFilteredTeams(teams);

        if(window.innerWidth < 1024) setShowFilters(false);
    };

    const resetFilters = () => {
        setFilters({ term: '', city: 'All', districts: [], skill: 'All', position: 'All' });
        setDistrictSearch('');
        setFilteredPlayers(mockPlayers);
        setFilteredTeams(mockTeams);
        if(window.innerWidth < 1024) setShowFilters(false);
    };

    const featuredPlayer = mockPlayers[0];
    const featuredTeam = mockTeams[1];

    const SkillBadge = ({ skill }) => {
        const colors = {
            Beginner: 'bg-blue-100 text-blue-800',
            Intermediate: 'bg-yellow-100 text-yellow-800',
            Advanced: 'bg-green-100 text-green-800',
        };
        return <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${colors[skill]}`}>{skill}</span>;
    };

    const FilterSidebar = () => (
        <div className="bg-white rounded-lg shadow-lg p-6">
             <h3 className="text-xl font-bold mb-4">Filters</h3>
             <div className="space-y-6">
                <div>
                    <label className="font-semibold text-gray-700">Skill Level</label>
                    <select name="skill" value={filters.skill} onChange={handleFilterChange} className="w-full p-2 border rounded-md mt-2"><option value="All">All Skills</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
                </div>
                {view === 'players' && (
                    <div>
                        <label className="font-semibold text-gray-700">Position</label>
                        <select name="position" value={filters.position} onChange={handleFilterChange} className="w-full p-2 border rounded-md mt-2"><option value="All">All Positions</option><option>Forward</option><option>Midfielder</option><option>Defender</option><option>Goalkeeper</option></select>
                    </div>
                )}
                <div>
                    <label htmlFor="city" className="font-semibold text-gray-700">City</label>
                    <select id="city" name="city" value={filters.city} onChange={handleFilterChange} className="w-full p-2 border rounded-md mt-2">
                        <option value="All">All Cities</option>
                        {allCities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                </div>
                <div className="relative">
                    <label className="font-semibold text-gray-700">District</label>
                    <button onClick={() => setIsDistrictDropdownOpen(!isDistrictDropdownOpen)} className="w-full text-left p-2 border rounded-md mt-2 flex justify-between items-center" disabled={filters.city === 'All'}>
                        <span>{filters.districts.length > 0 ? `${filters.districts.length} selected` : 'Select districts...'}</span>
                        <svg className={`w-5 h-5 transition-transform ${isDistrictDropdownOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    {isDistrictDropdownOpen && (
                        <div className="absolute w-full bg-white border rounded-md shadow-lg mt-1 p-2 z-10">
                            <input type="text" placeholder="Search districts..." value={districtSearch} onChange={(e) => setDistrictSearch(e.target.value)} className="w-full p-2 border rounded-md" />
                            <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                                {allDistricts.filter(d => d.toLowerCase().includes(districtSearch.toLowerCase())).map(district => (
                                    <label key={district} className="flex items-center p-1 rounded hover:bg-gray-100">
                                        <input type="checkbox" name="districts" value={district} checked={filters.districts.includes(district)} onChange={handleFilterChange} className="h-4 w-4 text-emerald-600 rounded" />
                                        <span className="ml-2">{district}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <button onClick={resetFilters} className="w-full bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg hover:bg-gray-300">Reset</button>
                    <button onClick={applyFilters} className="w-full bg-emerald-600 text-white font-semibold py-2 rounded-lg hover:bg-emerald-700">Apply</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-50">
            {/* Hero Section */}
            <div className="relative bg-gray-800 text-white py-20 px-6 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Community background" />
                <div className="relative container mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold">Community Spotlight</h1>
                    <p className="text-lg text-gray-300 mt-2 max-w-2xl mx-auto">Meet the top players and teams making waves in the Sportiva community.</p>
                </div>
            </div>

            {/* Featured Section */}
            <div className="container mx-auto px-6 -mt-16 relative z-10">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Featured Player */}
                    <div className="bg-white rounded-xl shadow-2xl p-6 flex items-center gap-6 transform hover:scale-105 transition-transform duration-300">
                        <img src={featuredPlayer.image} alt={featuredPlayer.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-emerald-400" />
                        <div className="flex-1">
                            <span className="text-sm font-bold text-emerald-600">PLAYER OF THE WEEK</span>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{featuredPlayer.name}</h3>
                            <div className="flex items-center text-gray-500 text-sm mt-1 gap-4">
                                <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>{featuredPlayer.position}</span>
                                <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>{featuredPlayer.district}</span>
                            </div>
                            <div className="mt-3">
                                <SkillBadge skill={featuredPlayer.skill} />
                            </div>
                        </div>
                    </div>
                    {/* Featured Team */}
                    <div className="bg-white rounded-xl shadow-2xl p-6 flex items-center gap-6 transform hover:scale-105 transition-transform duration-300">
                        <img src={featuredTeam.image} alt={featuredTeam.name} className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover border-4 border-blue-400" />
                        <div className="flex-1">
                            <span className="text-sm font-bold text-blue-600">TEAM OF THE WEEK</span>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{featuredTeam.name}</h3>
                            <p className="text-gray-600 mt-1">Looking for: <span className="font-semibold text-gray-800">{featuredTeam.lookingFor}</span></p>
                            <div className="mt-3">
                                <SkillBadge skill={featuredTeam.skill} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Discovery Section */}
            <div className="container mx-auto px-6 py-16">
                 <div className="flex justify-center border-b mb-8">
                    <button onClick={() => setView('players')} className={`px-8 py-3 font-semibold text-lg transition ${view === 'players' ? 'border-b-4 border-emerald-600 text-emerald-600' : 'text-gray-500 hover:text-gray-400'}`}>Players</button>
                    <button onClick={() => setView('teams')} className={`px-8 py-3 font-semibold text-lg transition ${view === 'teams' ? 'border-b-4 border-emerald-600 text-emerald-600' : 'text-gray-500 hover:text-gray-400'}`}>Teams</button>
                </div>
                 <div className="grid lg:grid-cols-4 gap-8">
                    <div className="hidden lg:block lg:col-span-1">
                        <FilterSidebar />
                    </div>
                     <div className="lg:hidden col-span-4">
                        <input name="term" value={filters.term} onChange={handleFilterChange} placeholder={`Search by ${view === 'players' ? 'player' : 'team'} name...`} className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-emerald-500 mb-4 shadow-sm" />
                        <button onClick={() => setShowFilters(!showFilters)} className="w-full bg-white p-3 rounded-lg shadow-md flex justify-between items-center">
                            <span className="font-semibold">Advanced Filters</span>
                            <svg className={`w-5 h-5 transition-transform ${showFilters ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        {showFilters && <div className="mt-4"><FilterSidebar /></div>}
                    </div>
                    <div className="lg:col-span-3">
                        <div className="hidden lg:block">
                            <input name="term" value={filters.term} onChange={handleFilterChange} placeholder={`Search by ${view === 'players' ? 'player' : 'team'} name...`} className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-emerald-500 mb-8 shadow-sm" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                            {view === 'players' ? filteredPlayers.map(p => (
                                <div key={p.id} className="bg-white rounded-lg shadow-md text-center transform hover:-translate-y-1 transition-transform duration-300 flex flex-col overflow-hidden group">
                                   <div className="p-6 flex-grow">
                                     <img src={p.image} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-gray-200 group-hover:border-emerald-300 transition-colors" />
                                     <h3 className="text-lg font-bold text-gray-800">{p.name}</h3>
                                     <p className="text-gray-500 text-sm">{p.position}</p>
                                     <div className="my-3"><SkillBadge skill={p.skill} /></div>
                                     <p className="text-gray-600 text-sm flex items-center justify-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>{p.district}</p>
                                   </div>
                                   <button onClick={() => onAction('contact', p)} className="w-full bg-gray-200 text-gray-800 font-semibold py-3 mt-auto group-hover:bg-emerald-600 group-hover:text-white transition-colors">Contact</button>
                                </div>
                            )) : filteredTeams.map(t => (
                                <div key={t.id} className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col group">
                                     <div className="relative">
                                        <img src={t.image} className="w-full h-32 object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                        <h3 className="absolute bottom-2 left-4 text-lg font-bold text-white">{t.name}</h3>
                                     </div>
                                     <div className="p-6 text-center flex-grow flex flex-col">
                                        <div className="mb-3"><SkillBadge skill={t.skill} /></div>
                                        <p className="text-gray-600 flex-grow">Looking for: <span className="font-semibold text-gray-800">{t.lookingFor}</span></p>
                                        <button onClick={() => onAction('view_profile', t)} className="mt-4 w-full bg-gray-800 text-white font-semibold py-2 rounded-lg hover:bg-black transition">View Profile</button>
                                     </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- DEDICATED ACTION & PAYMENT PAGES ---

const TeamProfilePage = ({ team, setPage, onAction }) => (
     <div className="bg-gray-100">
        <div className="container mx-auto px-6 py-12">
            <button onClick={() => setPage('community')} className="mb-8 text-emerald-600 hover:text-emerald-800 font-semibold">← Back to Community</button>
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="relative h-48 bg-gray-300">
                    <img src={team.image} className="w-full h-full object-cover" alt={`${team.name} banner`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-6">
                        <h1 className="text-4xl font-bold text-white">{team.name}</h1>
                        <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm mt-1">{team.skill}</span>
                    </div>
                </div>
                <div className="p-8">
                     <div className="md:flex justify-between items-center">
                        <p className="text-xl text-gray-600">Recruiting: <span className="font-bold text-gray-800">{team.lookingFor}</span></p>
                        <button onClick={() => onAction('join_request', team)} className="mt-4 md:mt-0 w-full md:w-auto bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-emerald-700 transition">Send Join Request</button>
                    </div>
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-gray-800">Team Members</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {team.members.map(player => (
                                <div key={player.id} className="text-center p-4 bg-gray-50 rounded-lg">
                                    <img src={player.image} className="w-24 h-24 rounded-full mx-auto mb-2 object-cover border-4 border-emerald-100"/>
                                    <p className="font-semibold text-gray-800">{player.name}</p>
                                    <p className="text-sm text-gray-500">{player.position}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
     </div>
);

const ActionModal = ({ type, data, onClose, onComplete }) => {
    const titles = {
        register: `Register for ${data.name}`,
        accept_challenge: `Accept Challenge from ${data.teamName}`,
        contact: `Contact ${data.name}`,
        join_request: `Request to Join ${data.name}`,
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const messages = {
            register: `Your team's registration for ${data.name} has been received.`,
            accept_challenge: `You have accepted the challenge from ${data.teamName}. Good luck!`,
            contact: `Your message to ${data.name} has been sent.`,
            join_request: `Your request to join ${data.name} has been sent.`
        };
        onComplete({ title: 'Success!', message: messages[type] });
    };

    const renderFormContent = () => {
        switch (type) {
            case 'register':
                return (
                    <form className="space-y-4 text-left" onSubmit={handleSubmit}>
                        <div><label htmlFor="teamName" className="block text-sm font-medium text-gray-700">Team Name</label><input type="text" id="teamName" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/></div>
                        <div><label htmlFor="captainName" className="block text-sm font-medium text-gray-700">Captain's Name</label><input type="text" id="captainName" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/></div>
                        <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label><input type="tel" id="phone" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/></div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">Submit Registration</button>
                    </form>
                );
            case 'accept_challenge':
                return (
                    <div className="text-center">
                        <p className="text-gray-700 mb-6">{data.details}</p>
                        <button onClick={handleSubmit} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">Confirm & Accept Challenge</button>
                    </div>
                );
            case 'contact':
            case 'join_request':
                 return (
                    <form className="space-y-4 text-left" onSubmit={handleSubmit}>
                        <div><label htmlFor="message" className="block text-sm font-medium text-gray-700">Your Message</label><textarea id="message" rows="4" required placeholder="Introduce yourself or your team..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"></textarea></div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">Send Message</button>
                    </form>
                );
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative p-8" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">{titles[type]}</h2>
                {renderFormContent()}
            </div>
        </div>
    );
};

const PaymentPage = ({ data, setPage, onComplete }) => {
    const [processing, setProcessing] = useState(false);
    const [paymentOption, setPaymentOption] = useState('full'); // 'full' or 'deposit'

    const depositAmount = Math.ceil(data.totalPrice * 0.25);
    const amountToPay = paymentOption === 'full' ? data.totalPrice : depositAmount;
    const paymentTypeMessage = paymentOption === 'full' ? `full amount (EGP ${amountToPay})` : `25% deposit (EGP ${amountToPay})`;

    const handlePayment = (method) => {
        setProcessing(true);
        setTimeout(() => {
            onComplete({
                title: 'Booking Confirmed!',
                message: `Your booking for ${data.field.name} for ${data.hours} hour(s) has been confirmed. You paid the ${paymentTypeMessage} via ${method}. Check your dashboard for details.`
            });
            setProcessing(false);
        }, 2000); // Simulate API call
    };

    if (processing) {
        return (
            <div className="container mx-auto px-6 py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">Processing Payment...</h1>
                <Spinner />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl px-6 py-12">
             <button onClick={() => { setPage('field_details'); }} className="mb-8 text-emerald-600 hover:text-emerald-800">← Back to Field Details</button>
            <div className="bg-white rounded-lg shadow-xl p-8">
                <h1 className="text-3xl font-bold text-center mb-2">Complete Your Booking</h1>
                <p className="text-gray-600 text-center mb-8">Confirm your details and choose a payment method.</p>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-8 border">
                    <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-600">Field:</span><span className="font-semibold">{data.field.name}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Location:</span><span className="font-semibold">{data.field.district}, {data.field.city}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Hours Booked:</span><span className="font-semibold">{data.hours}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Total Price:</span><span className="font-semibold">EGP {data.totalPrice}</span></div>
                         <div className="border-t my-2"></div>
                        <div className="flex justify-between text-xl"><span className="font-bold">Amount to Pay:</span><span className="font-bold text-emerald-600">EGP {amountToPay}</span></div>
                        {paymentOption === 'deposit' && data.totalPrice > 0 && (
                            <p className="text-right text-sm text-gray-500 mt-1">
                                Remaining balance of EGP {data.totalPrice - depositAmount} due at the venue.
                            </p>
                        )}
                    </div>
                </div>

                <h2 className="text-xl font-bold text-center mb-4">Select Payment Option</h2>
                 <div className="flex justify-center mb-6 border border-gray-200 rounded-lg p-1 bg-gray-100">
                    <button
                        onClick={() => setPaymentOption('full')}
                        className={`w-1/2 py-2 rounded-md font-semibold transition ${paymentOption === 'full' ? 'bg-emerald-600 text-white shadow' : 'bg-transparent text-gray-600'}`}
                    >
                        Pay Full Amount
                    </button>
                    <button
                        onClick={() => setPaymentOption('deposit')}
                        className={`w-1/2 py-2 rounded-md font-semibold transition ${paymentOption === 'deposit' ? 'bg-emerald-600 text-white shadow' : 'bg-transparent text-gray-600'}`}
                    >
                        Pay 25% Deposit
                    </button>
                </div>

                <h2 className="text-xl font-bold text-center mb-4">Select Payment Method</h2>
                <div className="space-y-4">
                     <button onClick={() => handlePayment('Instapay')} className="w-full flex items-center justify-center p-4 border-2 border-transparent rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-bold text-lg" disabled={amountToPay <= 0}>
                        <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.23 14.88l-3.54-3.54 1.41-1.41 2.12 2.12 4.95-4.95 1.41 1.41-6.36 6.37z"/></svg>
                        Pay with Instapay
                    </button>
                    <button onClick={() => handlePayment('Vodafone Cash')} className="w-full flex items-center justify-center p-4 border-2 border-transparent rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-bold text-lg" disabled={amountToPay <= 0}>
                        <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z"/></svg>
                        Pay with Vodafone Cash
                    </button>
                </div>
            </div>
        </div>
    );
};

// This is a placeholder as the real BrowseFieldsPage is not in the provided code
const BrowseFieldsPage = ({onSelectField}) => (
    <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold text-center mb-8">Browse Fields</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockFields.map(field => (
                <div key={field.id} onClick={() => onSelectField(field)} className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow group">
                    <div className="overflow-hidden h-48 relative">
                        <img src={field.image} alt={field.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute top-2 right-2 bg-emerald-600 text-white text-sm font-bold px-3 py-1 rounded-full">{field.rating} ★</div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{field.name}</h3>
                        <p className="text-gray-600">{field.district}, {field.city}</p>
                        <p className="text-lg font-semibold text-emerald-600 mt-4">EGP {field.price}/hr</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);


export default function App() {
    const [page, setPage] = useState('home');
    const [pageData, setPageData] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalContent, setModalContent] = useState(null); // For success/info popups
    const [actionModal, setActionModal] = useState(null); // For form modals

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, currentUser => { setUser(currentUser); setLoading(false); });
        return () => unsubscribe();
    }, []);

    const handleSignOut = () => signOut(auth).then(() => setPage('home'));
    
    const handleAction = (type, data) => {
        if (type === 'view_profile') {
            setPage('team_profile');
            setPageData(data);
        } else {
            setActionModal({ type, data });
        }
    };
    
    const handleCompletion = (modalData) => {
        setActionModal(null); // Close the form modal
        setModalContent(modalData); // Show the success message
    };

    const goToPayment = (bookingData) => {
        setPage('payment');
        setPageData(bookingData);
    };

    const renderPage = () => {
        switch (page) {
            case 'fields': return <BrowseFieldsPage onSelectField={(data) => { setPage('field_details'); setPageData(data); }} />;
            case 'field_details': return <FieldDetailsPage field={pageData} setPage={(p) => { setPage(p); setPageData(pageData); }} onBook={goToPayment} />;
            case 'community': return <CommunityPage onAction={handleAction} />;
            case 'challenges': return <ChallengesPage onAction={handleAction} />;
            case 'marketplace': return <MarketplacePage onSelectProduct={(data) => { setPage('product_details'); setPageData(data); }} />;
            case 'product_details': return <ProductDetailsPage product={pageData} setPage={setPage} />;
            case 'aboutus': return <AboutUsPage />;

            case 'team_profile': return <TeamProfilePage team={pageData} setPage={setPage} onAction={handleAction} />;
            case 'payment': return <PaymentPage data={pageData} setPage={(p) => { setPage('field_details'); setPageData(pageData.field); }} onComplete={handleCompletion} />;

            case 'dashboard': return <div className="container mx-auto p-8 text-center"><h1 className="text-4xl font-bold">Dashboard</h1><p>Coming Soon!</p></div>;
            case 'auth': return <div className="container mx-auto p-8 text-center"><h1 className="text-4xl font-bold">Login/Register</h1><p>Coming Soon!</p></div>;
            case 'home':
            default: return <HomePage setPage={setPage} onSelectField={(data) => { setPage('field_details'); setPageData(data); }} />;
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className="bg-gray-50 text-gray-800 font-sans">
            <Header page={page} setPage={setPage} user={user} onSignOut={handleSignOut} />
            <main>{renderPage()}</main>
            <Footer setPage={setPage} />
            {modalContent && <Modal onClose={() => setModalContent(null)}>
                <h2 className="text-2xl font-bold mb-4">{modalContent.title}</h2>
                <p>{modalContent.message}</p>
            </Modal>}
            {actionModal && <ActionModal 
                type={actionModal.type} 
                data={actionModal.data} 
                onClose={() => setActionModal(null)} 
                onComplete={handleCompletion} 
            />}
        </div>
    );
}
