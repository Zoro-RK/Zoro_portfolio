import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Folder,
  FileCode,
  FileJson,
  FileText,
  Terminal,
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Globe,
  Menu,
  X,
  Cpu,
  Layers,
  Code2,
  Zap,
  Activity,
  ShieldCheck,
  Moon,
  Sun,
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';

const ScrollContext = React.createContext<React.RefObject<HTMLDivElement> | null>(null);
gsap.registerPlugin(ScrollTrigger);

type FileType = 'sh' | 'json' | 'ts' | 'md';

interface FileItem {
  name: string;
  type: FileType;
  icon: any;
  content: React.ReactNode;
}

export default function App() {
  const [activeFile, setActiveFile] = useState<string>('welcome.sh');
  const [openFiles, setOpenFiles] = useState<string[]>(['welcome.sh']);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFolderOpen, setIsFolderOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // isContentReady gates WelcomeSection animations (text → character → sidebar)
  const [isContentReady, setIsContentReady] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrollingRef = useRef(false);

  useEffect(() => {
    // 1. Loading screen exits (with glitch) at 2.8s
    const loadTimer = setTimeout(() => setIsLoading(false), 2800);
    // 2. Text letters begin animating immediately after load exits
    const readyTimer = setTimeout(() => setIsContentReady(true), 2900);
    // 3. Sidebar collapses shortly after the character begins to appear
    const sidebarTimer = setTimeout(() => setIsSidebarOpen(false), 4200);
    return () => {
      clearTimeout(loadTimer);
      clearTimeout(readyTimer);
      clearTimeout(sidebarTimer);
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Automatically open the sidebar when no files are open (Dino game state)
    if (openFiles.length === 0 && !activeFile && !isLoading) {
      setIsSidebarOpen(true);
      setIsFolderOpen(true);
    }
  }, [openFiles.length, activeFile, isLoading]);

  const handleFileClick = (fileName: string) => {
    scrollToSection(fileName);
    setIsMobileMenuOpen(false);
    if (fileName === 'welcome.sh') {
      setIsSidebarOpen(false);
    }
  };

  const scrollToSection = (fileName: string) => {
    isScrollingRef.current = true;
    // Ensure it's in openFiles if we clicked it from sidebar
    setOpenFiles(prev => prev.includes(fileName) ? prev : [...prev, fileName]);
    setActiveFile(fileName);

    // Use a small timeout to allow the DOM to render if we were in System_Idle
    setTimeout(() => {
      const element = sectionRefs.current[fileName];
      if (element && contentRef.current) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Reset scrolling flag after animation
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 1000);
      } else {
        isScrollingRef.current = false;
      }
    }, 100);
  };

  const files: Record<string, FileItem> = {
    'welcome.sh': {
      name: 'welcome.sh',
      type: 'sh',
      icon: Terminal,
      content: <WelcomeSection onNavigate={handleFileClick} ready={isContentReady} />
    },
    'about.ts': {
      name: 'about.ts',
      type: 'ts',
      icon: FileCode,
      content: <AboutSection />
    },
    'skills.ts': {
      name: 'skills.ts',
      type: 'ts',
      icon: FileCode,
      content: <SkillsSection isDarkMode={isDarkMode} />
    },
    'projects.json': {
      name: 'projects.json',
      type: 'json',
      icon: FileJson,
      content: <ProjectsSection isDarkMode={isDarkMode} />
    },
    'contact.md': {
      name: 'contact.md',
      type: 'md',
      icon: FileText,
      content: <ContactSection />
    }
  };

  const fileKeys = Object.keys(files);

  // Scroll Sync and Auto-Open Logic
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const observerOptions = {
      root: container,
      threshold: 0.1, // Lower threshold to support tall sections (600vh+)
      rootMargin: '-5px 0px -5px 0px' // Slightly tighter margin for high-precision tracking
    };

    const observer = new IntersectionObserver((entries) => {
      if (isScrollingRef.current) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const fileName = entry.target.getAttribute('data-file-name');
          if (fileName) {
            setActiveFile(fileName);
            setOpenFiles(prev => {
              if (!prev.includes(fileName)) {
                return [...prev, fileName];
              }
              return prev;
            });
          }
        }
      });
    }, observerOptions);

    // Observe all possible sections
    fileKeys.forEach((fileName) => {
      const el = sectionRefs.current[fileName];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [fileKeys, activeFile]); // Re-run if fileKeys change (though they are static)

  const closeFile = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    isScrollingRef.current = true; // Block observer during close operation

    const currentIndex = openFiles.indexOf(fileName);
    const newOpenFiles = openFiles.filter(f => f !== fileName);

    setOpenFiles(newOpenFiles);

    if (activeFile === fileName) {
      if (newOpenFiles.length > 0) {
        // Move to previous or first available
        const nextActive = newOpenFiles[currentIndex - 1] || newOpenFiles[0];
        scrollToSection(nextActive);
      } else {
        setActiveFile('');
        isScrollingRef.current = false;
      }
    } else {
      // If we closed a non-active tab, keep the flag for a moment to let layout settle
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden select-none text-ide-text font-sans antialiased">
      {/* ── Loading Screen ── */}
      <AnimatePresence>
        {isLoading && <LoadingScreen />}
      </AnimatePresence>
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-ide-sidebar border-b border-ide-border z-50">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-ide-accent" />
          <span className="text-xs font-bold tracking-widest uppercase">Ruuban_IDE</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar (Desktop) */}
        <aside
          className={`hidden md:flex bg-ide-sidebar border-r border-ide-border flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-12'}`}
        >
          <div className="p-3 text-[10px] uppercase tracking-widest text-ide-muted font-bold flex items-center justify-between">
            {isSidebarOpen && <span>Repository Explorer</span>}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hover:text-ide-text transition-colors"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {isSidebarOpen && (
            <div className="flex-1 overflow-y-auto py-2">
              <div
                onClick={() => setIsFolderOpen(!isFolderOpen)}
                className="px-4 py-1 flex items-center gap-2 text-ide-muted hover:text-ide-text cursor-pointer group"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isFolderOpen ? '' : '-rotate-90'}`} />
                <Folder className="w-4 h-4 text-ide-accent" />
                <span className="text-sm font-medium">portfolio-v1</span>
              </div>

              <AnimatePresence>
                {isFolderOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="pl-8 mt-1 space-y-0.5 overflow-hidden"
                  >
                    {Object.values(files).map((file) => (
                      <div
                        key={file.name}
                        onClick={() => handleFileClick(file.name)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer transition-colors group ${activeFile === file.name ? 'bg-ide-accent/10 text-ide-accent border-r-2 border-ide-accent' : 'text-ide-muted hover:bg-ide-border/50 hover:text-ide-text'}`}
                      >
                        <file.icon className={`w-4 h-4 ${activeFile === file.name ? 'text-ide-accent' : 'text-ide-muted group-hover:text-ide-text'}`} />
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </aside>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-ide-sidebar z-40 md:hidden pt-16"
            >
              <div className="p-6 space-y-4">
                <div className="text-[10px] text-ide-muted uppercase tracking-widest mb-4">Files</div>
                {Object.values(files).map((file) => (
                  <div
                    key={file.name}
                    onClick={() => handleFileClick(file.name)}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${activeFile === file.name ? 'bg-ide-accent/10 border-ide-accent text-ide-accent' : 'border-ide-border text-ide-muted'}`}
                  >
                    <file.icon className="w-6 h-6" />
                    <span className="text-lg font-medium">{file.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <ScrollContext.Provider value={contentRef}>
          <main className="flex-1 flex flex-col min-w-0">
            {/* Tabs */}
            <div className="flex bg-ide-sidebar border-b border-ide-border overflow-x-auto no-scrollbar items-center pr-4">
              <div className="flex flex-1">
                {openFiles.map((fileName) => {
                  const file = files[fileName];
                  const Icon = file?.icon;
                  return (
                    <div
                      key={fileName}
                      onClick={() => scrollToSection(fileName)}
                      className={`flex items-center gap-2 px-4 py-2 text-xs border-r border-ide-border cursor-pointer transition-all min-w-[120px] group shrink-0 ${activeFile === fileName ? 'bg-ide-bg text-ide-accent border-t-2 border-t-ide-accent' : 'text-ide-muted hover:bg-ide-bg/50'}`}
                    >
                      {Icon && <Icon className="w-3 h-3" />}
                      <span className="truncate">{fileName}</span>
                      <button
                        onClick={(e) => closeFile(e, fileName)}
                        className="ml-auto w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-ide-accent/20 hover:text-ide-accent rounded transition-all duration-200"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 rounded-md hover:bg-ide-bg/50 text-ide-muted hover:text-ide-accent transition-all duration-300"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            {/* Editor Content */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto font-mono relative no-scrollbar smooth-scroll"
            >
              {openFiles.length > 0 || activeFile ? (
                <div className="flex flex-col gap-16 md:gap-32 pb-64">
                  {fileKeys.map((fileName) => (
                    <div
                      key={fileName}
                      ref={el => sectionRefs.current[fileName] = el}
                      data-file-name={fileName}
                      className="min-h-[60vh]"
                    >
                      {files[fileName].content}
                    </div>
                  ))}
                </div>
              ) : (
                <DinoGame />
              )}
            </div>
          </main>
        </ScrollContext.Provider>
      </div>

      {/* Status Bar */}
      <footer className="bg-ide-accent text-ide-bg px-2 md:px-4 py-1 text-[9px] md:text-[10px] font-bold flex items-center justify-between uppercase tracking-wider shrink-0 overflow-hidden">
        <div className="flex items-center gap-2 md:gap-6 truncate">
          <div className="flex items-center gap-1 text-glitch">
            <ChevronRight className="w-3 h-3" />
            <span className="hidden sm:inline">Branch:</span> <span>Production</span>
          </div>
          <div className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            <span className="hidden sm:inline">Status:</span> <span>Hirable</span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-6">
          <span className="hidden md:inline">UTF-8</span>
          <span className="hidden sm:inline">TypeScript (React)</span>
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            <span className="hidden lg:inline">Player:</span> <span>Ruuban</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef({
    ball: { x: 80, y: 0, vy: 0, r: 14, grounded: true },
    obstacles: [] as { x: number; w: number; h: number }[],
    ground: 0,
    score: 0,
    highScore: 0,
    speed: 4.5,
    gameOver: false,
    started: false,
    frame: 0,
    animFrame: 0,
  });
  const rafRef = useRef(0);

  const drawBall = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, isDead: boolean, frame: number) => {
    const color = getComputedStyle(document.documentElement).getPropertyValue('--ide-text').trim() || '#2A2A2A';
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    // Rolling indicator line
    if (!isDead) {
      const angle = (frame * 0.15) % (Math.PI * 2);
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ide-bg').trim() || '#E5E5E5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r * 0.7, cy + Math.sin(angle) * r * 0.7);
      ctx.stroke();
    } else {
      // X mark on dead ball
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--ide-bg').trim() || '#E5E5E5';
      ctx.strokeStyle = bg;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 4, cy - 4); ctx.lineTo(cx + 4, cy + 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 4, cy - 4); ctx.lineTo(cx - 4, cy + 4); ctx.stroke();
    }
    ctx.restore();
  };

  const drawSpike = (ctx: CanvasRenderingContext2D, x: number, groundY: number, h: number) => {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ide-text').trim() || '#2A2A2A';
    // Triangle spike
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x + 8, groundY - h);
    ctx.lineTo(x + 16, groundY);
    ctx.closePath();
    ctx.fill();
    // Second smaller spike
    if (h > 28) {
      ctx.beginPath();
      ctx.moveTo(x + 12, groundY);
      ctx.lineTo(x + 18, groundY - h * 0.7);
      ctx.lineTo(x + 24, groundY);
      ctx.closePath();
      ctx.fill();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const p = canvas.parentElement;
      if (!p) return;
      canvas.width = p.clientWidth;
      canvas.height = Math.min(p.clientHeight, 220);
      gameStateRef.current.ground = canvas.height - 20;
      if (!gameStateRef.current.started) {
        gameStateRef.current.ball.y = gameStateRef.current.ground - gameStateRef.current.ball.r;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const jump = () => {
      const g = gameStateRef.current;
      if (g.gameOver) {
        g.obstacles = [];
        g.score = 0;
        g.speed = 4.5;
        g.gameOver = false;
        g.started = true;
        g.ball.y = g.ground - g.ball.r;
        g.ball.vy = 0;
        g.ball.grounded = true;
        g.frame = 0;
        return;
      }
      if (!g.started) g.started = true;
      if (g.ball.grounded) {
        g.ball.vy = -11;
        g.ball.grounded = false;
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
    };
    const handleClick = () => jump();
    const handleTouch = (e: TouchEvent) => { e.preventDefault(); jump(); };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    window.addEventListener('keydown', handleKey);

    const textColor = () => getComputedStyle(document.documentElement).getPropertyValue('--ide-text').trim() || '#2A2A2A';
    const mutedColor = () => getComputedStyle(document.documentElement).getPropertyValue('--ide-muted').trim() || '#666';

    const loop = () => {
      const g = gameStateRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ground
      ctx.strokeStyle = textColor();
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, g.ground);
      ctx.lineTo(canvas.width, g.ground);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ground dots
      ctx.fillStyle = mutedColor();
      for (let i = (g.frame * 2) % 20; i < canvas.width; i += 20) {
        ctx.fillRect(i, g.ground + 4 + (i % 7), 2, 1);
      }

      if (!g.started) {
        drawBall(ctx, g.ball.x, g.ground - g.ball.r, g.ball.r, false, 0);
        ctx.fillStyle = mutedColor();
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press Space / Click / Tap to start', canvas.width / 2, g.ground / 2);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (!g.gameOver) {
        g.frame++;
        g.ball.vy += 0.55;
        g.ball.y += g.ball.vy;
        if (g.ball.y >= g.ground - g.ball.r) {
          g.ball.y = g.ground - g.ball.r;
          g.ball.vy = 0;
          g.ball.grounded = true;
        }

        // Spawn spikes
        if (g.frame % Math.max(50, 105 - g.score) === 0) {
          g.obstacles.push({ x: canvas.width + 20, w: 24, h: 22 + Math.random() * 22 });
        }

        // Move
        g.obstacles.forEach(ob => ob.x -= g.speed);
        g.obstacles = g.obstacles.filter(ob => ob.x > -30);

        // Collision (circle vs spike region)
        for (const ob of g.obstacles) {
          const spikeCx = ob.x + 8;
          const spikeTip = g.ground - ob.h;
          const dx = g.ball.x - spikeCx;
          const dy = g.ball.y - Math.max(spikeTip, g.ball.y);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < g.ball.r + 6 && g.ball.y + g.ball.r > spikeTip + 4) {
            g.gameOver = true;
            if (g.score > g.highScore) g.highScore = g.score;
            break;
          }
        }

        if (g.frame % 6 === 0) g.score++;
        if (g.frame % 300 === 0) g.speed += 0.3;
      }

      // Draw spikes
      g.obstacles.forEach(ob => drawSpike(ctx, ob.x, g.ground, ob.h));
      // Draw ball
      drawBall(ctx, g.ball.x, g.ball.y, g.ball.r, g.gameOver, g.frame);

      // Score
      ctx.fillStyle = mutedColor();
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`HI ${String(g.highScore).padStart(5, '0')}  ${String(g.score).padStart(5, '0')}`, canvas.width - 10, 18);

      if (g.gameOver) {
        ctx.fillStyle = textColor();
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, g.ground / 2 - 10);
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillStyle = mutedColor();
        ctx.fillText('Press Space or Tap to restart', canvas.width / 2, g.ground / 2 + 12);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKey);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouch);
    };
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 md:px-8 select-none">
      {/* IDE-style no file message */}
      <div className="flex flex-col items-center mb-6 md:mb-8">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-ide-muted" />
          <span className="text-sm md:text-base font-mono text-ide-muted">No file is selected</span>
        </div>
        <span className="text-[10px] md:text-xs font-mono text-ide-accent/60">
          Select <span className="text-ide-accent font-bold">welcome.sh</span> to begin your quest
        </span>
      </div>

      {/* Dino Game Container */}
      <div className="w-full max-w-2xl border border-ide-border rounded-lg bg-ide-sidebar/50 backdrop-blur-sm overflow-hidden">
        {/* Chrome-style header bar */}
        <div className="flex items-center gap-2 px-3 md:px-4 py-2 border-b border-ide-border bg-ide-sidebar">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
          </div>
          <span className="text-[9px] md:text-[10px] font-mono text-ide-muted ml-2 uppercase tracking-widest">
            game.exe
          </span>
          <span className="text-[9px] md:text-[10px] font-mono text-ide-muted/40 ml-auto hidden sm:inline">
            Space / Click / Tap to play
          </span>
        </div>

        {/* Canvas */}
        <div className="w-full h-[180px] md:h-[220px] p-1 md:p-2">
          <canvas ref={canvasRef} className="w-full h-full cursor-pointer" />
        </div>
      </div>

      {/* Bottom hint */}
      <div className="mt-3 md:mt-4 text-[9px] md:text-[10px] font-mono text-ide-muted/40 uppercase tracking-widest text-center">
        Status: Idle // Mode: Offline // Game: T-Rex Runner
      </div>
    </div>
  );
}

function LoadingScreen() {
  const [lines, setLines] = useState<string[]>([]);
  const [exiting, setExiting] = useState(false);

  const bootLines = [
    "> PORTFO_V1 :: INITIALIZING...",
    "> LOADING_KERNEL :: [████████░░] 80%",
    "> LOADING_KERNEL :: [██████████] 100%",
    "> MOUNTING_ENV :: ✓ typescript.runtime",
    "> MOUNTING_ENV :: ✓ react.renderer",
    "> BOOT_SEQUENCE COMPLETE.",
    "> WELCOME."
  ];

  useEffect(() => {
    bootLines.forEach((line, i) => {
      setTimeout(() => {
        setLines(prev => [...prev, line]);
      }, i * 310);
    });
    // Trigger exit animation shortly before loader is removed
    setTimeout(() => setExiting(true), 2300);
  }, []);

  return (
    <motion.div
      key="loader"
      className={`fixed inset-0 z-[999] bg-ide-bg flex flex-col items-center justify-center px-8 md:px-24 ${exiting ? 'loader-exit-anim' : ''}`}
      exit={{ opacity: 0 }}
    >
      {/* Top branding */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-3">
        <Terminal className="w-5 h-5 text-ide-accent" />
        <span className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-ide-accent">PORTFOLIO_V1</span>
      </div>

      {/* Boot terminal lines — centered */}
      <div className="font-mono text-xs md:text-sm space-y-2 w-full max-w-2xl text-center">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`${i === lines.length - 1 ? 'text-ide-accent font-bold' : 'text-ide-muted'}`}
          >
            {line}
          </motion.div>
        ))}
        {/* Blinking cursor */}
        <div className="w-2 h-4 bg-ide-accent animate-pulse inline-block mx-auto" />
      </div>

      {/* Glitch scanline overlay — pulses as the loader nears exit */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        animate={exiting ? { opacity: [0, 0.4, 0, 0.6, 0] } : { opacity: 0 }}
        transition={{ duration: 0.5, times: [0, 0.2, 0.4, 0.7, 1] }}
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        }}
      />

      {/* Bottom line */}
      <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 text-[10px] font-mono text-ide-muted uppercase tracking-widest">
        Portfolio_v1 :: Loading Assets
      </div>
    </motion.div>
  );
}

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode, delay?: number, key?: string | number }) {
  const ref = useRef(null);
  const container = React.useContext(ScrollContext);

  const { scrollYProgress } = useScroll({
    target: ref,
    container: container || undefined,
    offset: ["start end", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 25,
    restDelta: 0.001
  });

  // Direct scroll-linked transformations for "frame by frame" feel
  // Fades out only when moving towards the bottom (scrolling up to previous section)
  const opacity = useTransform(smoothProgress, [0, 0.2, 1], [0, 1, 1]);
  const y = useTransform(smoothProgress, [0, 0.2, 1], [100, 0, 0]);
  const scale = useTransform(smoothProgress, [0, 0.2, 1], [0.8, 1, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y, scale }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
}

function WelcomeSection({ onNavigate, ready }: { onNavigate: (file: string) => void; ready: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Video portal hover setup
  const [isHovering, setIsHovering] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const trailRef = useRef<{ x: number, y: number, jx: number, jy: number }[]>([]);

  // Much snappier and faster responding springs
  const springConfig = { damping: 25, stiffness: 180 };
  const fluidX = useSpring(50, springConfig);
  const fluidY = useSpring(50, springConfig);
  const tearScale = useSpring(0, { damping: 20, stiffness: 100 });
  const [maskStyle, setMaskStyle] = useState({});

  useEffect(() => {
    const updateMask = () => {
      const x = fluidX.get();
      const y = fluidY.get();
      const scale = tearScale.get();

      // Only push significantly new coordinates to the tear history array to prevent overlapping lag
      const lastPoint = trailRef.current[trailRef.current.length - 1];
      if (!lastPoint || Math.abs(lastPoint.x - x) > 0.2 || Math.abs(lastPoint.y - y) > 0.2) {
        trailRef.current.push({ x, y, jx: 0.3 + Math.random() * 1.4, jy: 0.3 + Math.random() * 1.4 });
      }

      // Lock structural trail limit
      if (trailRef.current.length > 35) {
        trailRef.current.shift();
      }

      // If portal is fully sealed, wipe the history array completely
      if (scale <= 0.01) {
        trailRef.current = [];
        setMaskStyle({ maskImage: 'none', WebkitMaskImage: 'none' });
        return;
      }

      // Map the history array into an overlapping concatenation of varying structural cuts
      const gradients = trailRef.current.map((point, i) => {
        // Taper the older points in the tear to simulate a closing tail
        const ageScale = (i + 1) / trailRef.current.length;
        // Make the trace footprint a highly asymmetric shattered ellipse natively
        const rx = 240 * scale * ageScale * point.jx;
        const ry = 240 * scale * ageScale * point.jy;
        return `radial-gradient(ellipse ${rx}px ${ry}px at ${point.x}% ${point.y}%, black 0%, transparent 100%)`;
      });

      const gradStr = gradients.join(', ');

      setMaskStyle({
        maskImage: gradStr,
        WebkitMaskImage: gradStr,
      });
    };

    const unsubscribeX = fluidX.on("change", updateMask);
    const unsubscribeY = fluidY.on("change", updateMask);
    const unsubscribeScale = tearScale.on("change", updateMask);

    return () => {
      unsubscribeX();
      unsubscribeY();
      unsubscribeScale();
    };
  }, [fluidX, fluidY, tearScale]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    fluidX.set(x);
    fluidY.set(y);

    tearScale.set(1);
    setIsMoving(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      tearScale.set(0);
      setIsMoving(false);
    }, 3000);
  };

  useEffect(() => {
    if (!ready) return; // Wait until loading screen is gone

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.05 });

      // Start image fully invisible
      tl.set(imgRef.current, { opacity: 0 });

      // ── PHASE 1: Letters glide in smoothly ──────────────────────────────
      tl.from(".letter", {
        y: 50,
        opacity: 0,
        rotateX: -55,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.06,
      });

      // ── PHASE 2: ~1s pause, then character glitch-materialises ──────────
      tl.addLabel("charIn", "+= 0.9"); // 0.9s after last letter lands

      tl.to(imgRef.current, { opacity: 0.9, filter: "brightness(5) contrast(4) invert(1)", duration: 0.05 }, "charIn")
        .to(imgRef.current, { opacity: 0, duration: 0.04 })
        .to(imgRef.current, { opacity: 0.7, filter: "brightness(2) hue-rotate(120deg) saturate(3)", duration: 0.05 })
        .to(imgRef.current, { opacity: 0, duration: 0.04 })
        .to(imgRef.current, { opacity: 0.8, filter: "brightness(1.5) invert(0.2)", duration: 0.05 })
        .to(imgRef.current, { opacity: 0, duration: 0.03 })
        .to(imgRef.current, { opacity: 1, filter: "none", duration: 0.08, clearProps: "filter" });

    }, containerRef);
    return () => ctx.revert();
  }, [ready]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setIsMoving(false);
        tearScale.set(0);
      }}
      className="relative flex items-end justify-center min-h-[85vh] md:min-h-[95vh] overflow-hidden group"
    >
      {/* Background Text matching nice.png style */}
      <div
        ref={textRef}
        className="absolute top-[25%] md:top-[30%] lg:top-[20%] xl:top-[18%] inset-x-0 flex flex-col items-center md:items-stretch justify-center -z-10 pointer-events-none w-full px-[2vw] md:px-[5vw] lg:px-[4vw]"
      >
        <div className="flex flex-col w-full items-center justify-center text-[16vw] sm:text-[20vw] md:text-[20vw] lg:text-[14vw] xl:text-[14vw] font-['Playfair_Display',_serif] font-normal uppercase tracking-normal leading-[0.8] select-none">
          <div className="whitespace-nowrap text-transparent relative z-0 overflow-visible drop-shadow-sm text-center md:text-left lg:-ml-[2vw] xl:-ml-[3vw] md:w-full lg:-translate-y-[2vw] xl:-translate-y-[3.5vw]" style={{ WebkitTextStroke: 'calc(1px + 0.1vw) var(--color-ide-accent)' }}>
            {'HELLO'.split('').map((char, i) => <span key={`h-${i}`} className="inline-block letter">{char}</span>)}
          </div>
          <div className="whitespace-nowrap text-ide-accent tracking-wider drop-shadow-lg text-center md:text-right ml-0 md:ml-0 md:pl-[2vw] pr-0 md:pr-[2vw] lg:pr-0 md:w-full lg:-mr-[8vw] xl:-mr-[10vw] md:mt-[2vw]">
            {'WORLD'.split('').map((char, i) => <span key={`w-${i}`} className="inline-block letter">{char}</span>)}
          </div>
        </div>
      </div>

      {/* Revealed Interactive Video Overlay (Supersedes text & character) */}
      <motion.div
        className={`absolute inset-0 w-full h-full pointer-events-none z-30 transition-opacity duration-1000 ${(isHovering && isMoving) ? 'opacity-100' : 'opacity-0'}`}
        style={maskStyle}
      >
        <video
          src="/frame2.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </motion.div>

      <img
        ref={imgRef}
        src="/bg_transparent.png"
        alt="Welcome Background"
        className="block w-[130%] sm:w-[120%] md:w-auto h-auto md:h-full max-h-[75vh] md:max-h-[85vh] lg:max-h-[95vh] max-w-none object-contain object-bottom pointer-events-none translate-y-px brightness-110 img-glitch-auto relative z-20"
      />
    </div>
  );
}

function AboutSection() {
  const [sliderPos, setSliderPos] = useState(0);
  const [hasSlided, setHasSlided] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setSliderPos(x);
    if (!hasSlided) setHasSlided(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
    setSliderPos(x);
    if (!hasSlided) setHasSlided(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-16">
      <ScrollReveal>
        <h2 className="text-2xl md:text-4xl font-bold mb-8 md:mb-12 border-b border-ide-border pb-4 tracking-widest lowercase">about.ts</h2>
      </ScrollReveal>

      <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
        <ScrollReveal delay={0.1}>
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
              setIsHovering(false);
              setSliderPos(0);
            }}
            onTouchEnd={() => {
              setIsHovering(false);
              setSliderPos(0);
            }}
            className="relative aspect-[3/4] lg:aspect-[2/3] bg-ide-sidebar border-2 border-ide-accent overflow-hidden group select-none cursor-ew-resize"
          >
            {/* Base Image (Animated/Sketch) fully covered initially */}
            <img
              src="/prof2.png"
              alt="Portrait Base"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Revealed Real Image via Invisible Slider */}
            <div
              className={`absolute inset-0 w-full h-full pointer-events-none ${isHovering ? 'transition-none' : 'transition-[clip-path] duration-1000 ease-out'}`}
              style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
            >
              <img
                src="/prof1.png"
                alt="Portrait Reveal"
                className="w-full h-full object-cover"
              />
            </div>


          </div>
        </ScrollReveal>

        <div className="space-y-6 md:space-y-8">
          <ScrollReveal delay={0.2}>
            <h3 className="text-xl md:text-2xl font-display text-ide-accent uppercase tracking-tighter">System_Architect: </h3>
            <p className="text-base md:text-lg text-ide-muted leading-relaxed mt-2">
              Hey, I’m Ruuban, a passionate AI/ML enthusiast and full-stack developer eager to
              apply machine learning skills to real-world problems. Combines
              creaAvity with technical experAse to build intuiAve, user-friendly
              applicaAons and visually engaging digital experiences.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="p-4 md:p-6 bg-white/40 backdrop-blur-sm border border-ide-border">
              <div className="text-[10px] text-ide-muted mb-4 uppercase tracking-widest">SYSTEM_CAPABILITIES: ACTIVE_MODULES</div>
              <ul className="space-y-3 md:space-y-4 text-xs md:text-sm font-mono">
                <li className="flex gap-3 md:gap-4">
                  <span className="text-ide-accent font-bold shrink-0">[AI]</span>
                  <span>Neural_Processing: Training models that learn from historical data to automate intelligent decision-making and pattern recognition.</span>
                </li>
                <li className="flex gap-3 md:gap-4">
                  <span className="text-ide-accent font-bold shrink-0">[FS]</span>
                  <span>Full_Stack_Architecture: Constructing responsive, scalable, and fortified web applications that bridge intuitive interfaces with powerful backends.</span>
                </li>
                <li className="flex gap-3 md:gap-4">
                  <span className="text-ide-accent font-bold shrink-0">[OP]</span>
                  <span>Optimization_Protocol: Every line of code is engineered for performance, modularity, and maintainability.</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}

function ProjectsSection({ isDarkMode }: { isDarkMode?: boolean }) {
  const projects = [
    {
      id: "01",
      title: "SYMPTO_AI",
      subtitle: "PRIMARY_PROCESS",
      description: "An AI-powered telemedicine platform that makes healthcare more accessible. Features symptom tracking, intelligent diagnosis suggestions, and real-time consultation mechanisms.",
      tech: ["Python", "Flask", "TensorFlow", "React"],
      image: "/tele.png"
    },
    {
      id: "02",
      title: "E_WAY",
      subtitle: "SECONDARY_PROCESS",
      description: "An E-Waste Intelligence System powered by custom-trained image recognition models. Bringing sustainability into a data-driven ecosystem for smarter waste classification.",
      tech: ["Python", "PyTorch", "React", "Custom Dataset"],
      image: "/eway.png"
    },
    {
      id: "03",
      title: "ERP_SYSTEM",
      subtitle: "BUSINESS_LOGIC",
      description: "A full-stack business management application built with MERN stack. Streamlined workflows with AI-based classification for smarter procurement handling.",
      tech: ["React", "Node.js", "MongoDB", "Express"],
      image: "/erp.png"
    },
    {
      id: "04",
      title: "EMAIL_REMINDER",
      subtitle: "BACKGROUND_JOB",
      description: "A smart, reliable, and efficient automated communication scheduling system. Precision-engineered for timely reminders and seamless notification delivery.",
      tech: ["Node.js", "Twilio", "Firebase", "JWT"],
      image: "/rem.png"
    }
  ];

  const sectionRef = useRef<HTMLDivElement>(null);
  const container = React.useContext(ScrollContext);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    container: container || undefined,
    offset: ["start end", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 250, // Ultra-responsive for immediate nav results
    damping: 50,
    restDelta: 0.001
  });

  const step = 1 / 7; // 700vh total (100vh entry + 600vh section track)
  const buffer = 0.08; // Snappier transitions

  // Intro animations - trigger as the first project expands (Transition 2/7 to 3/7)
  const introOpacity = useTransform(smoothProgress, [0, 0.11, 0.12, 2 * step, 2 * step + buffer], [0, 0, 1, 1, 0]);
  const introX = useTransform(smoothProgress, [2 * step, 2 * step + buffer], [0, -100]);

  return (
    <div ref={sectionRef} className="relative h-[500vh] w-full">

      <div className="sticky top-0 h-[calc(100vh-32px)] w-full overflow-hidden bg-transparent">
        {/* Left Side - Static Content (Intro) - Now absolute behind the accordion */}
        <motion.div
          style={{ opacity: introOpacity, x: introX }}
          className="absolute inset-y-0 left-0 w-full md:w-[80%] h-full p-8 md:p-16 flex flex-col justify-start z-0 bg-transparent"
        >
          <div className="space-y-6">
            <h2 className="text-2xl md:text-4xl font-bold mb-8 md:mb-12 border-b border-ide-border pb-4 tracking-widest text-ide-text lowercase">
              projects.json
            </h2>
            <p className="text-base md:text-xl text-ide-muted font-light leading-relaxed max-w-sm">
              Building high-performance systems with <span className="text-ide-accent font-bold">AI integration</span> and modern full-stack architectures, focused on creating scalable, intuitive, and real-world solutions.
            </p>
          </div>
        </motion.div>

        {/* Right Side - Sliding Accordion Panels */}
        <div className="absolute inset-0 z-10">
          {projects.map((project, i) => {
            const start = ((i + 1.5) * step) + 0.01; // condensed timeline to reduce dead scroll space
            const animEnd = start + buffer;

            const projectsCount = projects.length;
            const stripWidth = 5; // 5% each
            const initialRight = (projectsCount - 1 - i) * stripWidth;
            const initialWidth = stripWidth;

            // Width and Position animation
            const width = useTransform(
              smoothProgress,
              [start, animEnd],
              [`${initialWidth}%`, "100%"]
            );

            const right = useTransform(
              smoothProgress,
              [start, animEnd],
              [`${initialRight}%`, "0%"]
            );

            // Content animations removed for "static" look
            const contentOpacity = 1;
            const contentScale = 1;
            const contentBlur = "blur(0px)";

            // Staggered element transforms removed
            const titleX = 0;
            const descX = 0;
            const techX = 0;
            const imageScale = 1;
            const imageOpacity = 1;

            // Staggered Entry Effect (Staircase from video) - Smoother, no fade
            const entryDelay = (projectsCount - 1 - i) * 0.015;
            const entryStart = entryDelay;
            const entryEnd = step * 0.9; // Finish ascent slightly BEFORE hitting the top            
            const entryY = useTransform(smoothProgress, [entryStart, entryEnd], [250, 0]);
            const entryScaleY = useTransform(smoothProgress, [entryStart, entryEnd], [0.95, 1]);
            const entryOpacity = 1; // Always opaque per user request

            // Background color - subtle shift to highlight active
            const bgColorStart = isDarkMode ? "#F5F5F5" : "#0F0F0F";
            const bgColorEnd = isDarkMode ? "#FFFFFF" : "#161616";
            const bgColor = useTransform(
              smoothProgress,
              [start, animEnd],
              [bgColorStart, bgColorEnd]
            );

            // Shadow for depth as it slides over
            const shadowOpacity = useTransform(
              smoothProgress,
              [start, start + buffer],
              [0, 0.6]
            );

            return (
              <motion.div
                key={project.id}
                style={{
                  width,
                  right,
                  y: entryY,
                  scaleY: entryScaleY,
                  opacity: entryOpacity,
                  backgroundColor: bgColor,
                  zIndex: i,
                  boxShadow: useTransform(shadowOpacity, (v) => `-${v * 60}px 0 100px rgba(0,0,0,${v})`)
                }}
                className="absolute top-0 bottom-0 border-l border-white/5 overflow-hidden flex origin-bottom"
              >
                {/* Vertical Label (Collapsed State) */}
                <div className="w-12 md:w-20 h-full flex flex-col items-center justify-end pb-10 shrink-0 z-20">
                  <motion.span
                    style={{ opacity: useTransform(smoothProgress, [start, start + buffer * 0.3], [1, 0.3]) }}
                    className={`[writing-mode:vertical-rl] text-lg md:text-2xl font-bold uppercase tracking-tighter whitespace-nowrap ${isDarkMode ? 'text-black/40' : 'text-white/20'}`}
                  >
                    {project.subtitle}
                  </motion.span>
                  <motion.span
                    style={{ opacity: useTransform(smoothProgress, [start, start + buffer * 0.3], [1, 0.5]) }}
                    className={`text-xl md:text-3xl font-black mt-4 ${isDarkMode ? 'text-black/60' : 'text-white/40'}`}
                  >
                    {project.id}
                  </motion.span>
                </div>

                {/* Expanded Content */}
                <motion.div
                  style={{
                    opacity: contentOpacity,
                    scale: contentScale,
                    filter: contentBlur
                  }}
                  className="absolute inset-0 left-12 md:left-20 p-4 md:p-16 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-16 overflow-y-auto"
                >
                  <div className="flex-1 space-y-8">
                    <motion.div style={{ x: titleX }} className="space-y-2 md:space-y-4">
                      <h3 className={`text-2xl md:text-7xl font-display leading-none uppercase ${isDarkMode ? 'text-black' : 'text-white'}`}>
                        {project.title}
                      </h3>
                      <div className="h-0.5 md:h-1 w-16 md:w-24 bg-ide-accent" />
                    </motion.div>

                    <motion.p style={{ x: descX }} className={`text-sm md:text-xl font-light leading-relaxed max-w-xl ${isDarkMode ? 'text-black/70' : 'text-white/60'}`}>
                      {project.description}
                    </motion.p>

                    <motion.div style={{ x: techX }} className="flex flex-wrap gap-3">
                      {project.tech.map(t => (
                        <span key={t} className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'border-black/10 text-black/60' : 'border-white/10 text-white/40'}`}>
                          {t}
                        </span>
                      ))}
                    </motion.div>

                    <motion.a
                      style={{ x: techX }}
                      href="https://github.com/Zoro-RK?tab=repositories"
                      className={`inline-flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] transition-colors group/link ${isDarkMode ? 'text-black hover:text-ide-accent/60' : 'text-white hover:text-ide-accent'}`}
                    >
                      INITIALIZE_SYSTEM <ExternalLink className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                    </motion.a>
                  </div>

                  {/* Image with parallax-ish reveal */}
                  <motion.div
                    style={{ scale: imageScale, opacity: imageOpacity }}
                    className="w-full md:w-1/2 h-1/2 md:h-[70%] overflow-hidden rounded-sm border border-white/5 shadow-2xl"
                  >
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover object-left-top"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SkillsSection({ isDarkMode }: { isDarkMode?: boolean }) {
  const skillGroups = [
    {
      title: "Languages",
      icon: Code2,
      skills: ["Python", "JavaScript", "PHP", "TypeScript"],
      color: "#f0f0f0"
    },
    {
      title: "Frontend",
      icon: Layers,
      skills: ["React", "Vite", "TailwindCSS", "Framer Motion"],
      color: "#f0f0f0"
    },
    {
      title: "Backend",
      icon: Cpu,
      skills: ["Node.js", "Flask", "Express", "Firebase"],
      color: "#f0f0f0"
    },
    {
      title: "AI_&_ML",
      icon: Zap,
      skills: ["TensorFlow", "PyTorch", "Keras", "NumPy"],
      color: "#f0f0f0"
    },
    {
      title: "Databases",
      icon: Activity,
      skills: ["MongoDB", "MySQL", "SQLite", "Firebase DB"],
      color: "#f0f0f0"
    },
    {
      title: "Dev_Tools",
      icon: ShieldCheck,
      skills: ["Git & GitHub", "Postman", "Twilio", "JWT"],
      color: "#f0f0f0"
    }
  ];

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  const sectionRef = useRef<HTMLDivElement>(null);
  const container = React.useContext(ScrollContext);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    container: container || undefined,
    offset: ["start start", "end end"]
  });

  // Smooth out the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 250, // Match ProjectsSection for snappy nav positioning
    damping: 50,
    restDelta: 0.001
  });

  return (
    <div ref={sectionRef} className="relative h-[300vh] max-w-7xl mx-auto p-4 md:p-16">
      <div className="sticky top-0 h-[calc(100vh-32px)] flex flex-col items-center justify-center">
        <div className="absolute top-0 left-0 w-full z-20">
          <ScrollReveal>
            <h2 className="text-2xl md:text-4xl font-bold mb-8 md:mb-12 border-b border-ide-border pb-4 tracking-widest lowercase">
              skills.ts
            </h2>
          </ScrollReveal>
        </div>

        {/* The Vault (Storage Box) */}
        <motion.div
          style={{
            opacity: useTransform(smoothProgress, [0.8, 0.82, 0.84, 0.86, 0.88, 0.9, 0.92], [1, 0.8, 1, 0.3, 0.7, 0.1, 0]),
            scale: useTransform(smoothProgress, [0.8, 0.9], [1, 0.9]),
            x: useTransform(smoothProgress, [0.8, 0.82, 0.84, 0.86, 0.88, 0.9], [0, -10, 15, -5, 20, 0]),
            filter: useTransform(smoothProgress, [0.8, 0.9], ["blur(0px)", "blur(10px)"])
          }}
          className="absolute bottom-0 w-[240px] md:w-[460px] h-16 md:h-32 bg-ide-sidebar border-x-4 border-t-4 border-ide-border rounded-t-[40px] z-[50] shadow-2xl flex flex-col items-center pt-6 md:pt-12 overflow-hidden"
        >
          {/* Side Panels */}
          <div className="absolute left-0 top-0 bottom-0 w-4 md:w-8 border-r border-ide-border/30 bg-ide-bg/10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-4 md:w-8 border-l border-ide-border/30 bg-ide-bg/10"></div>

          <div className="flex gap-4 mb-4 relative z-10">
            <div className="w-2 h-2 bg-ide-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(0,0,0,0.2)]"></div>
            <div className="w-2 h-2 bg-ide-muted rounded-full"></div>
            <div className="w-2 h-2 bg-ide-muted rounded-full"></div>
          </div>

          {/* Rivets */}
          <div className="absolute top-4 left-6 w-1.5 h-1.5 rounded-full bg-ide-border shadow-inner"></div>
          <div className="absolute top-12 left-6 w-1.5 h-1.5 rounded-full bg-ide-border shadow-inner"></div>
          <div className="absolute top-4 right-6 w-1.5 h-1.5 rounded-full bg-ide-border shadow-inner"></div>
          <div className="absolute top-12 right-6 w-1.5 h-1.5 rounded-full bg-ide-border shadow-inner"></div>
        </motion.div>

        {/* Cards Container */}
        <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: '2000px' }}>
          {skillGroups.map((group, i) => {
            // Staggered pop sequence
            const start = (i * 0.12);
            const end = start + 0.15;

            // Responsive layout logic
            let col, row, xMult, yMult, cardScale;
            if (isMobile) {
              col = i % 2;
              row = Math.floor(i / 2);
              xMult = 160;
              yMult = 95;
              cardScale = 0.5;
            } else if (isTablet) {
              col = i % 2;
              row = Math.floor(i / 2);
              xMult = 300;
              yMult = 200;
              cardScale = 0.85;
            } else {
              col = i % 3;
              row = Math.floor(i / 3);
              xMult = 420;
              yMult = 300;
              cardScale = 1.1;
            }

            const opacity = useTransform(smoothProgress, [start, start + 0.05, end], [0, 1, 1]);

            const targetY = isMobile ? (row - 1) * yMult : (row - 0.5) * yMult - 20;
            const targetX = isMobile ? (col - 0.5) * xMult : (isTablet ? (col - 0.5) * xMult : (col - 1) * xMult);

            const y = useTransform(smoothProgress, [start, end], [400, targetY]);
            const x = useTransform(smoothProgress, [start, end], [0, targetX]);
            const scale = useTransform(smoothProgress, [start, end], [0.4, cardScale]);
            const rotateX = useTransform(smoothProgress, [start, end], [45, isMobile ? 0 : (row - 0.5) * -10]);
            const rotateY = useTransform(smoothProgress, [start, end], [0, isMobile ? 0 : (col - 1) * 10]);
            const z = useTransform(smoothProgress, [start, end], [-100, 0]);

            return (
              <motion.div
                key={group.title}
                style={{
                  opacity,
                  y,
                  x,
                  scale,
                  rotateX,
                  rotateY,
                  z,
                  backgroundColor: 'var(--skill-card-bg)',
                  clipPath: 'path("M 0 32 Q 0 0 32 0 L 100 0 Q 120 0 130 20 L 140 32 L 288 32 Q 320 32 320 64 L 320 192 Q 320 224 288 224 L 32 224 Q 0 224 0 192 Z")',
                  filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.1)) drop-shadow(0 10px 20px rgba(0,0,0,0.1))'
                }}
                className="absolute w-80 h-56 flex flex-col p-8 will-change-[transform,opacity,filter]"
              >
                {/* Tab Content */}
                <div className="absolute top-2 left-4 flex items-center gap-2">
                  <group.icon className="w-4 h-4 text-ide-accent" />
                  <span className="text-[9px] font-mono font-bold opacity-60 uppercase tracking-widest text-[#888]">Module_0{i + 1}</span>
                </div>

                <div className="mt-6" style={{ color: 'var(--skill-card-text)' }}>
                  <h3 className="text-2xl md:text-3xl font-black leading-none tracking-tighter uppercase mb-4">
                    {group.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {group.skills.map(skill => (
                      <li key={skill} className="text-[12px] font-mono flex items-center gap-2 font-medium">
                        <div className="w-1.5 h-1.5 bg-black dark:bg-white" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto flex justify-between items-center opacity-40">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-ide-accent rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-ide-accent rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-ide-accent rounded-full"></div>
                  </div>
                  <span className="text-[10px] font-mono">SYS_CORE_v1.0</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ContactSection() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-16">
      <ScrollReveal>
        <h2 className="text-2xl md:text-4xl font-bold mb-8 md:mb-12 border-b border-ide-border pb-4 tracking-widest lowercase">contact.md</h2>
      </ScrollReveal>

      <div className="space-y-8 md:space-y-12">
        <ScrollReveal delay={0.1}>
          <div className="prose prose-invert">
            <p className="text-base md:text-xl text-ide-muted leading-relaxed">
              Initiate a secure connection for collaboration or system inquiries. Ready to integrate into new environments and tackle complex technical requirements.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-3 md:gap-4">
          <ScrollReveal delay={0.2}>
            <a href="mailto:ruubanraja@gmail.com" className="flex items-center gap-4 md:gap-6 p-4 md:p-6 bg-white/40 backdrop-blur-sm border border-ide-border hover:border-ide-accent transition-all group shadow-sm hover:shadow-lg">
              <Mail className="w-5 h-5 md:w-6 md:h-6 text-ide-accent shrink-0" />
              <div className="truncate">
                <div className="text-[9px] md:text-[10px] text-ide-muted uppercase tracking-widest mb-1 font-bold">Email</div>
                <div className="text-sm md:text-lg font-bold group-hover:text-ide-accent transition-colors truncate">ruubanraja@gmail.com</div>
              </div>
            </a>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <a href="https://github.com/Zoro-RK" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 md:gap-6 p-4 md:p-6 bg-white/40 backdrop-blur-sm border border-ide-border hover:border-ide-accent transition-all group shadow-sm hover:shadow-lg">
              <Github className="w-5 h-5 md:w-6 md:h-6 text-ide-accent shrink-0" />
              <div className="truncate">
                <div className="text-[9px] md:text-[10px] text-ide-muted uppercase tracking-widest mb-1 font-bold">GitHub</div>
                <div className="text-sm md:text-lg font-bold group-hover:text-ide-accent transition-colors truncate">github.com/Zoro-RK</div>
              </div>
            </a>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <a href="https://linkedin.com/in/ruuban-raj" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 md:gap-6 p-4 md:p-6 bg-white/40 backdrop-blur-sm border border-ide-border hover:border-ide-accent transition-all group shadow-sm hover:shadow-lg">
              <Linkedin className="w-5 h-5 md:w-6 md:h-6 text-ide-accent shrink-0" />
              <div className="truncate">
                <div className="text-[9px] md:text-[10px] text-ide-muted uppercase tracking-widest mb-1 font-bold">LinkedIn</div>
                <div className="text-sm md:text-lg font-bold group-hover:text-ide-accent transition-colors truncate">linkedin.com/in/ruuban-raj</div>
              </div>
            </a>
          </ScrollReveal>
        </div>

      </div>
    </div>
  );
}
