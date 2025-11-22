import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function Navbar() {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-xl shadow-sm">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo Section */}
                    <Link to="/" className="flex items-center space-x-3 group">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                            <i className="fa-solid fa-eye text-lg"></i>
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tight text-gray-900">
                                TrueSight<span className="text-blue-600">AI</span>
                            </span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                                Content Verification Engine
                            </span>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-1">
                        <Link
                            to="/"
                            className={cn(
                                "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                                isActive('/')
                                    ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                        >
                            <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                            Analyze
                        </Link>
                        <Link
                            to="/history"
                            className={cn(
                                "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                                isActive('/history')
                                    ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                        >
                            <i className="fa-solid fa-clock-rotate-left mr-2"></i>
                            History
                        </Link>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200"
                        >
                            <i className="fa-brands fa-github mr-2"></i>
                            GitHub
                        </a>
                    </div>

                    {/* Mobile Menu Button (Placeholder) */}
                    <button className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                        <i className="fa-solid fa-bars text-xl"></i>
                    </button>
                </div>
            </div>
        </nav>
    );
}
