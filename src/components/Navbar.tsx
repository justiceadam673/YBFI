import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Bot, Download, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/ThemeToggle";
import logo from "@/assets/ybf-logo.jpeg";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Messages", path: "/messages" },
    { name: "Gallery", path: "/gallery" },
    { name: "Testimonies", path: "/testimonies" },
    { name: "Q&A", path: "/qa" },
    { name: "Books", path: "/books" },
    { name: "Blog", path: "/blog" },
    { name: "Visions & Dreams", path: "/visions-dreams" },
    { name: "Prayer Requests", path: "/prayer-requests" },
    { name: "GospelBuddy.AI", path: "/gospel-buddy" },
    { name: "Install App", path: "/install" },
    { name: "Support", path: "/partner" },
    { name: "Admin Q&A", path: "/admin-qa" },
    { name: "Admin News", path: "/admin-announcements" },
    {
      name: "WhatsApp",
      path: "https://chat.whatsapp.com/DzxsuHOQQpo6II0RK22VN0",
      external: true,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className='sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-soft'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <Link
            to='/'
            className='flex items-center gap-3 hover:opacity-80 transition-smooth'
          >
            <img src={logo} alt='YBF Logo' className='h-10 w-auto' />
            <span className='font-bold text-lg text-primary hidden sm:block'>
              YBFI
            </span>
          </Link>

          <div className='hidden lg:flex items-center gap-1'>
            <Link to='/'>
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                className='transition-smooth'
              >
                Home
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='transition-smooth'>
                  Growth <ChevronDown className='ml-1 h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='bg-background border shadow-lg'>
                <DropdownMenuItem asChild>
                  <Link to='/messages' className='w-full cursor-pointer'>
                    Messages
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/books' className='w-full cursor-pointer'>
                    Books
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/blog' className='w-full cursor-pointer'>
                    Blog
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/visions-dreams' className='w-full cursor-pointer'>
                    Visions & Dreams
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/prayer-requests' className='w-full cursor-pointer flex items-center gap-2'>
                    <Heart className="h-4 w-4 text-red-500" />
                    Prayer Requests
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/gospel-buddy' className='w-full cursor-pointer flex items-center gap-2'>
                    <Bot className="h-4 w-4 text-primary" />
                    GospelBuddy.AI
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/install' className='w-full cursor-pointer flex items-center gap-2'>
                    <Download className="h-4 w-4 text-green-500" />
                    Install App
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to='/gallery'>
              <Button
                variant={isActive("/gallery") ? "default" : "ghost"}
                className='transition-smooth'
              >
                Gallery
              </Button>
            </Link>

            <Link to='/testimonies'>
              <Button
                variant={isActive("/testimonies") ? "default" : "ghost"}
                className='transition-smooth'
              >
                Testimonies
              </Button>
            </Link>

            <Link to='/qa'>
              <Button
                variant={isActive("/qa") ? "default" : "ghost"}
                className='transition-smooth'
              >
                Q&A
              </Button>
            </Link>

            <Link to='/partner'>
              <Button
                variant={isActive("/partner") ? "default" : "ghost"}
                className='transition-smooth'
              >
                Support
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='transition-smooth'>
                  Admin <ChevronDown className='ml-1 h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='bg-background border shadow-lg'>
                <DropdownMenuItem asChild>
                  <Link to='/admin-qa' className='w-full cursor-pointer'>
                    Admin Q&A
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/admin-announcements' className='w-full cursor-pointer'>
                    Admin News
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <a
              href='https://chat.whatsapp.com/DzxsuHOQQpo6II0RK22VN0'
              target='_blank'
              rel='noopener noreferrer'
            >
              <Button variant='ghost' className='transition-smooth'>
                WhatsApp
              </Button>
            </a>

            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button
              className='p-2 rounded-lg hover:bg-muted transition-smooth'
              onClick={() => setIsOpen(!isOpen)}
              aria-label='Toggle menu'
            >
              {isOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className='lg:hidden border-t animate-fade-in'>
          <div className='px-2 pt-2 pb-3 space-y-1'>
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.path}
                  href={link.path}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={() => setIsOpen(false)}
                >
                  <Button
                    variant='ghost'
                    className='w-full justify-start transition-smooth'
                  >
                    {link.name}
                  </Button>
                </a>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                >
                  <Button
                    variant={isActive(link.path) ? "default" : "ghost"}
                    className='w-full justify-start transition-smooth'
                  >
                    {link.name === "GospelBuddy.AI" && <Bot className="h-4 w-4 mr-2 text-primary" />}
                    {link.name === "Install App" && <Download className="h-4 w-4 mr-2 text-green-500" />}
                    {link.name === "Prayer Requests" && <Heart className="h-4 w-4 mr-2 text-red-500" />}
                    {link.name}
                  </Button>
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
