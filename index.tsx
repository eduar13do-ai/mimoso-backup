import { useState, useEffect, useRef, FormEvent } from "react";
import { createRoot } from "react-dom/client";
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";
// @ts-ignore
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyClXYg4fERlzIy-YjacJ7K0CtIwthHGGig",
  authDomain: "mimoso-test-console.firebaseapp.com",
  projectId: "mimoso-test-console",
  storageBucket: "mimoso-test-console.firebasestorage.app",
  messagingSenderId: "278829716578",
  appId: "1:278829716578:web:b2c64463ffc0f644a6ad3b"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- TIPOS ---
interface Participant {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  id_plataforma: string;
  sorteado: boolean;
  created_at: string;
  participation_count?: number; // Novo campo
}

// --- DADOS FAKES (PARA VISUALIZAÇÃO) ---
const FAKE_PARTICIPANTS: Participant[] = [
  { id: 'fake-1', nome: "João 'Mimoso' Silva", email: 'joao@game.com', telefone: '(11) 99999-1234', cpf: '123.***.***-00', id_plataforma: 'JoaoGamer_YT', sorteado: false, created_at: new Date().toISOString(), participation_count: 12 },
  { id: 'fake-2', nome: 'Maria Sorte', email: 'maria@sorte.com', telefone: '(21) 98888-5678', cpf: '456.***.***-11', id_plataforma: 'MaryLucky', sorteado: true, created_at: new Date(Date.now() - 10000000).toISOString(), participation_count: 5 },
  { id: 'fake-3', nome: 'Pedro Apostador', email: 'pedro@bet.com', telefone: '(31) 97777-9012', cpf: '789.***.***-22', id_plataforma: 'PedrinhoBet', sorteado: false, created_at: new Date(Date.now() - 5000000).toISOString(), participation_count: 3 },
  { id: 'fake-4', nome: 'Ana Streamer', email: 'ana@live.com', telefone: '(41) 96666-3456', cpf: '321.***.***-33', id_plataforma: 'AnaLiveON', sorteado: false, created_at: new Date(Date.now() - 200000).toISOString(), participation_count: 1 },
  { id: 'fake-5', nome: 'Carlos Vencedor', email: 'carlos@win.com', telefone: '(51) 95555-7890', cpf: '654.***.***-44', id_plataforma: 'CarlinhosVencedor', sorteado: false, created_at: new Date(Date.now() - 3600000).toISOString(), participation_count: 8 },
  { id: 'fake-6', nome: 'Lucas Player', email: 'lucas@play.com', telefone: '(11) 94444-1111', cpf: '987.***.***-55', id_plataforma: 'LucasP_007', sorteado: false, created_at: new Date(Date.now() - 86400000).toISOString(), participation_count: 2 },
  { id: 'fake-7', nome: 'Fernanda Games', email: 'fer@games.com', telefone: '(71) 93333-2222', cpf: '159.***.***-66', id_plataforma: 'Nanda_Gamer', sorteado: false, created_at: new Date(Date.now() - 40000000).toISOString(), participation_count: 15 },
  { id: 'fake-8', nome: 'Roberto Firmino', email: 'beto@futa.com', telefone: '(81) 92222-3333', cpf: '777.***.***-77', id_plataforma: 'BetoGoal', sorteado: false, created_at: new Date(Date.now() - 100000).toISOString(), participation_count: 1 },
  { id: 'fake-9', nome: 'Julia Roberts', email: 'ju@movie.com', telefone: '(11) 91111-2222', cpf: '888.***.***-88', id_plataforma: 'JuCine', sorteado: false, created_at: new Date(Date.now() - 900000).toISOString(), participation_count: 4 },
  { id: 'fake-10', nome: 'Goku Silva', email: 'goku@dbz.com', telefone: '(99) 99999-9999', cpf: '999.***.***-99', id_plataforma: 'Kakaroto123', sorteado: false, created_at: new Date(Date.now() - 50000).toISOString(), participation_count: 42 },
];

// --- ESTILOS CSS ---
const styles = `
:root {
  --bg-dark: #02040a;
  --bg-card: #0d1117;
  --bg-input: #161b22;
  --border: #30363d;
  --primary: #fbbf24;
  --primary-hover: #f59e0b;
  --admin-red: #ef4444;
  --admin-green: #10b981;
  --admin-purple: #8b5cf6;
  --text-main: #f0f6fc;
  --text-muted: #8b949e;
}

* { box-sizing: border-box; margin: 0; padding: 0; outline: none; font-family: 'Segoe UI', 'Roboto', sans-serif; }

body { 
  background-color: var(--bg-dark); 
  color: var(--text-main); 
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* Fundo Animado Cassino */
.casino-bg {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 0; overflow: hidden;
  background: radial-gradient(circle at 50% 0%, #1a1f2e 0%, var(--bg-dark) 90%);
}

.floating-item {
  position: absolute;
  bottom: -150px;
  color: rgba(255, 215, 0, 0.4);
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  font-weight: bold;
  user-select: none;
  animation: floatUp linear infinite;
  will-change: transform;
}

@keyframes floatUp {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.8; }
  100% { transform: translateY(-120vh) rotate(360deg); opacity: 0; }
}

.content-wrapper { position: relative; z-index: 1; }

/* --- ADMIN LAYOUT --- */
.admin-header-bar {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 2rem 5%; margin-bottom: 2rem;
}
.live-status { display: flex; flex-direction: column; gap: 0.5rem; }
.live-badge {
  background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; 
  font-weight: 800; font-size: 0.75rem; text-transform: uppercase; display: inline-block; width: fit-content;
}
.page-title { font-size: 2rem; font-weight: 800; color: #fff; margin: 0; }
.page-subtitle { color: var(--text-muted); font-size: 0.9rem; }

.admin-actions { display: flex; gap: 1rem; }
.btn-top {
  padding: 0.75rem 1.5rem; border-radius: 6px; border: none; font-weight: 700; cursor: pointer;
  text-transform: uppercase; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;
}
.btn-red { background: var(--admin-red); color: white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); }
.btn-green { background: var(--admin-green); color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); }
.btn-dark { background: #21262d; color: var(--text-muted); border: 1px solid var(--border); }
.btn-dark:hover { color: white; border-color: white; }

/* Stats Grid */
.stats-container {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem;
  padding: 0 5%; margin-bottom: 3rem;
}
@media (max-width: 1024px) { .stats-container { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) { .stats-container { grid-template-columns: 1fr; } }

.stat-box {
  background: #0d1117; border: 1px solid #21262d;
  border-radius: 12px; padding: 1.5rem; position: relative;
  display: flex; flex-direction: column; height: 120px; justify-content: center;
}
.stat-label { color: var(--text-muted); font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; }
.stat-number { font-size: 2.5rem; font-weight: 700; color: white; line-height: 1; }
.stat-icon {
  position: absolute; top: 1.5rem; right: 1.5rem; 
  width: 40px; height: 40px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
  background: rgba(255,255,255,0.03); color: var(--text-muted);
}

/* Table Area */
.data-area { padding: 0 5%; }
.filter-bar {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;
  background: #0d1117; padding: 1rem; border-radius: 8px; border: 1px solid #21262d;
}
.search-input {
  background: #010409; border: 1px solid #30363d; color: white; padding: 0.6rem 1rem;
  border-radius: 6px; width: 300px;
}
.bulk-actions {
  display: flex; gap: 1rem; margin-bottom: 1rem;
}
.btn-sm {
    padding: 0.5rem 1rem; border-radius: 6px; border: none; font-weight: 700; cursor: pointer;
    font-size: 0.75rem; text-transform: uppercase;
}

.table-container {
  background: #0d1117; border: 1px solid #21262d; border-radius: 12px; overflow: hidden;
}
.table { width: 100%; border-collapse: collapse; }
.table th {
  text-align: left; padding: 1rem 1.5rem; color: var(--text-muted); 
  font-size: 0.75rem; text-transform: uppercase; font-weight: 700;
  border-bottom: 1px solid #21262d; background: #161b22;
}
.table td {
  padding: 1rem 1.5rem; border-bottom: 1px solid #21262d; color: #e6edf3; font-size: 0.9rem;
}
.table tr:hover { background: rgba(255,255,255,0.02); }

/* --- USER FORM LAYOUT --- */
.user-layout {
  display: flex; align-items: center; justify-content: center; min-height: 100vh;
  padding: 2rem;
}
.user-card { width: 100%; max-width: 550px; }
.brand-header { margin-bottom: 2rem; }
.brand-title { font-size: 2.5rem; font-weight: 900; line-height: 1.1; margin-bottom: 0.5rem; }
.brand-subtitle { color: var(--text-muted); font-size: 1rem; }
.form-card {
  background: #0d1117; border: 1px solid #30363d; border-radius: 16px; padding: 2.5rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}
.form-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: white; }
.form-desc { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 2rem; }

.input-group { margin-bottom: 1.25rem; }
.input-label { display: block; color: var(--text-muted); font-size: 0.75rem; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase; }
.input-wrapper { position: relative; }
.input-icon {
  position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
  color: #6e7681;
}
.custom-input {
  width: 100%; background: #010409; border: 1px solid #30363d;
  color: white; padding: 1rem 1rem 1rem 3rem; border-radius: 8px;
  font-size: 1rem; transition: 0.2s;
}
.custom-input:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.2); }

.btn-yellow {
  width: 100%; background: var(--primary); color: #000;
  padding: 1rem; border: none; border-radius: 8px;
  font-weight: 800; font-size: 1rem; text-transform: uppercase; cursor: pointer;
  margin-top: 1rem; box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
  transition: transform 0.1s;
}
.btn-yellow:hover { background: var(--primary-hover); }
.btn-yellow:active { transform: scale(0.98); }

.terms { display: flex; gap: 0.75rem; align-items: flex-start; margin-top: 1.5rem; }
.terms input { margin-top: 4px; accent-color: var(--primary); }
.terms label { font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; }
.terms a { color: var(--primary); text-decoration: none; }

.toggle-btn {
  position: fixed; bottom: 20px; right: 20px; background: #333; color: #fff;
  padding: 10px 20px; border-radius: 30px; border: 1px solid #555; cursor: pointer;
  font-size: 0.8rem; opacity: 0.5; z-index: 999;
}
.toggle-btn:hover { opacity: 1; }

.tag-id { 
  background: rgba(139, 92, 246, 0.15); color: #a78bfa; 
  padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-family: monospace; 
}

/* --- ROULETTE MODAL STYLES --- */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.92); backdrop-filter: blur(8px);
  z-index: 100; display: flex; align-items: center; justify-content: center;
}

.modal-content {
  background: linear-gradient(180deg, #161b22 0%, #0d1117 100%);
  border: 1px solid #30363d;
  border-radius: 24px;
  width: 90%; max-width: 420px;
  padding: 0 2rem 2rem 2rem;
  text-align: center;
  position: relative;
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.7);
  margin-top: 100px;
  transition: all 0.3s;
}

.wheel-container {
  position: absolute;
  top: -140px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 300px;
  z-index: 10;
  pointer-events: none;
  filter: drop-shadow(0 0 40px rgba(251, 191, 36, 0.15));
}

.wheel-pointer {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 25;
  width: 40px; height: 50px;
  /* Complex pointer shape */
  filter: drop-shadow(0 4px 4px rgba(0,0,0,0.6));
}
.wheel-pointer::before {
  content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 20px; height: 20px; background: #ef4444; border-radius: 50%;
  border: 3px solid #7f1d1d;
  box-shadow: inset 0 2px 5px rgba(255,255,255,0.4);
}
.wheel-pointer::after {
  content: ''; position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  width: 0; height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-top: 30px solid #ef4444;
}

.wheel-rotate {
  width: 100%; height: 100%;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  transition: transform 5s cubic-bezier(0.15, 0.85, 0.35, 1);
  
  /* Metallic Rim Effect */
  padding: 12px; /* Rim thickness */
  background-image: linear-gradient(135deg, #b45309 0%, #fcd34d 25%, #b45309 50%, #fcd34d 75%, #b45309 100%);
  box-shadow: 0 20px 30px rgba(0,0,0,0.5), inset 0 0 15px rgba(0,0,0,0.8);
}

.wheel-inner-border {
  width: 100%; height: 100%;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
  border: 2px solid #552800;
  background: #1f2937;
}

/* Background Slices */
.wheel-surface {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: conic-gradient(
    from 15deg, /* Rotate slightly so split is at top (360/12/2) */
    #991b1b 0deg 30deg,
    #111827 30deg 60deg,
    #991b1b 60deg 90deg,
    #111827 90deg 120deg,
    #991b1b 120deg 150deg,
    #111827 150deg 180deg,
    #991b1b 180deg 210deg,
    #111827 210deg 240deg,
    #991b1b 240deg 270deg,
    #111827 270deg 300deg,
    #991b1b 300deg 330deg,
    #111827 330deg 360deg
  );
}

.wheel-text-slot {
  position: absolute;
  top: 50%; left: 50%;
  width: 42%; height: 0px; /* Zero height, used for rotation origin */
  transform-origin: 0% 50%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 15px;
  font-size: 0.85rem;
  font-weight: 800;
  color: white;
  text-transform: uppercase;
  text-shadow: 1px 1px 0px rgba(0,0,0,0.8);
  white-space: nowrap;
  z-index: 5;
}

.wheel-hub {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 60px; height: 60px;
  border-radius: 50%;
  z-index: 21;
  /* Metallic Knob */
  background: radial-gradient(circle at 30% 30%, #fcd34d, #b45309, #451a03);
  box-shadow: 0 5px 15px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.3);
  border: 2px solid #78350f;
  display: flex; align-items: center; justify-content: center;
}
.wheel-hub::after {
    content: ''; width: 20px; height: 20px;
    background: radial-gradient(circle at 30% 30%, #9ca3af, #374151);
    border-radius: 50%;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);
}

.modal-section-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.filter-group {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 8rem; /* Space for wheel overlap */
}

.filter-btn {
  background: transparent;
  border: 1px solid #374151;
  color: #9ca3af;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;
}
.filter-btn.active { border-color: #fbbf24; color: #fbbf24; background: rgba(251, 191, 36, 0.1); }
.filter-btn:hover { border-color: #fbbf24; }

.count-control {
  display: flex; align-items: center; justify-content: center; gap: 1rem;
  background: #1f2937; padding: 0.5rem; border-radius: 8px; margin-bottom: 1rem;
}
.count-btn {
  background: #374151; width: 24px; height: 24px; border-radius: 4px; border:none; color: white; cursor: pointer;
}
.count-display { font-weight: bold; color: white; min-width: 20px; }

.prize-display {
  font-size: 2rem;
  font-weight: 900;
  color: #fbbf24;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
  margin-bottom: 1rem;
}

.custom-range {
  -webkit-appearance: none; width: 100%; height: 6px; background: #374151;
  border-radius: 3px; outline: none; margin-bottom: 2rem;
}
.custom-range::-webkit-slider-thumb {
  -webkit-appearance: none; width: 28px; height: 28px; background: #fbbf24;
  border: 4px solid #1f2937; border-radius: 50%; cursor: pointer;
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.5); transition: transform 0.1s;
}
.custom-range::-webkit-slider-thumb:hover { transform: scale(1.1); }

.action-btn {
  width: 100%; padding: 1rem; border-radius: 12px; border: none; font-weight: 800;
  text-transform: uppercase; font-size: 1rem; cursor: pointer; transition: all 0.2s;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
}
.btn-primary {
  background: linear-gradient(to bottom, #fbbf24, #d97706);
  color: #000; text-shadow: 0 1px 0 rgba(255,255,255,0.4);
}
.btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
.btn-primary:active { transform: translateY(1px); }
.btn-disabled { background: #374151; color: #9ca3af; cursor: not-allowed; box-shadow: none; }

.cancel-link {
  display: block; margin-top: 1.5rem; color: #6b7280; text-decoration: none;
  font-size: 0.8rem; text-decoration: underline; cursor: pointer;
}

/* Winner List Animation */
.winner-list-container {
  max-height: 200px; overflow-y: auto; text-align: left;
  background: rgba(0,0,0,0.3); border-radius: 8px; padding: 1rem;
  margin-bottom: 1rem;
}
.winner-item {
  padding: 0.5rem; border-bottom: 1px solid #374151; display: flex; justify-content: space-between;
  animation: fadeIn 0.5s ease forwards; opacity: 0;
}
@keyframes fadeIn { to { opacity: 1; } }

/* Canvas Confetti */
.confetti-canvas {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999;
}

/* MISSING CONFIG OVERLAY */
.config-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: #02040a; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
}
.config-card {
    background: #0d1117; padding: 2rem; border-radius: 12px; border: 1px solid #30363d;
    max-width: 500px; text-align: center;
}
`;

// --- COMPONENTES ---

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const colors = ['#fbbf24', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6'];

    for (let i = 0; i < 200; i++) {
      particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        w: Math.random() * 10 + 5,
        h: Math.random() * 10 + 5,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        dr: (Math.random() - 0.5) * 10,
        gravity: 0.2
      });
    }

    let animationId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.dr;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      animationId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return <canvas ref={canvasRef} className="confetti-canvas" />;
}

// Componente do Fundo Animado
function CasinoBackground() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const icons = ['♠', '♥', '♦', '♣', '🎲', '🎰', '7️⃣', '💰', '💎'];
    const newItems = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      icon: icons[Math.floor(Math.random() * icons.length)],
      left: Math.random() * 100 + '%',
      duration: 5 + Math.random() * 15 + 's',
      delay: -Math.random() * 20 + 's',
      size: 1.5 + Math.random() * 3.5 + 'rem',
      opacity: 0.2 + Math.random() * 0.6
    }));
    setItems(newItems);
  }, []);

  return (
    <div className="casino-bg">
      {items.map(item => (
        <div key={item.id} className="floating-item" style={{
          left: item.left,
          animationDuration: item.duration,
          animationDelay: item.delay,
          fontSize: item.size,
          opacity: item.opacity
        }}>
          {item.icon}
        </div>
      ))}
    </div>
  );
}

// Modal de Roleta
interface RouletteModalProps {
  onClose: () => void;
  participants: Participant[];
  onFinish: (winners: Participant[]) => void;
}

function RouletteModal({ onClose, participants, onFinish }: RouletteModalProps) {
  const [prize, setPrize] = useState(100);
  const [winnerCount, setWinnerCount] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'new' | 'present'>('all');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  
  // Controle de estado para mostrar resultados
  const [showResults, setShowResults] = useState(false);
  const [drawnWinners, setDrawnWinners] = useState<Participant[]>([]);
  const [wheelSegments, setWheelSegments] = useState<Participant[]>([]);

  // Lógica de Filtro
  const getFilteredParticipants = () => {
    let list = participants.filter(p => !p.sorteado);
    if (filterType === 'new') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      list = list.filter(p => new Date(p.created_at) > oneDayAgo);
    }
    return list;
  };

  const eligibleCount = getFilteredParticipants().length;

  // Atualiza os segmentos visuais da roleta quando a lista muda
  useEffect(() => {
    const list = getFilteredParticipants();
    // Pegamos até 12 nomes para exibir na roleta visualmente
    // Se tiver menos de 12, repetimos para preencher
    let displayList: Participant[] = [];
    if (list.length > 0) {
      if (list.length >= 12) {
        // Pega 12 aleatórios para mostrar
        displayList = list.slice(0, 12); 
      } else {
        // Repete até encher
        while (displayList.length < 12) {
           displayList = [...displayList, ...list];
        }
        displayList = displayList.slice(0, 12);
      }
    }
    setWheelSegments(displayList);
  }, [filterType, participants]);

  const handleSpin = () => {
    const list = getFilteredParticipants();
    if (list.length === 0) return;

    setSpinning(true);
    setShowResults(false);
    setDrawnWinners([]);

    // 1. Sorteia N vencedores
    const winners: Participant[] = [];
    // Cria copia para não repetir
    let tempPool = [...list];
    
    // Precisamos definir quem será o "Visual Winner" (o que a roleta aponta)
    // Vamos dizer que o primeiro sorteado é o visual.
    // Mas para a roleta, precisamos que esse vencedor esteja nos segmentos visuais.
    
    // Passo A: Escolhe o vencedor visual
    const visualWinnerIndex = Math.floor(Math.random() * tempPool.length);
    const mainWinner = tempPool[visualWinnerIndex];
    
    // Passo B: Remove ele do pool e adiciona aos vencedores
    tempPool.splice(visualWinnerIndex, 1);
    winners.push(mainWinner);

    // Passo C: Sorteia os outros (se houver)
    const extraCount = Math.min(winnerCount - 1, tempPool.length);
    for(let i=0; i<extraCount; i++) {
        const idx = Math.floor(Math.random() * tempPool.length);
        winners.push(tempPool[idx]);
        tempPool.splice(idx, 1);
    }

    setDrawnWinners(winners);

    // 2. Prepara a Roleta Visual para cair no mainWinner
    // Atualiza os segmentos para garantir que o mainWinner esteja na posição 0 (topo por padrão antes da rotação?)
    // Não, vamos fazer assim: Colocamos o mainWinner no índice 0 do array de segmentos visuais.
    // Os outros 11 preenchemos com aleatórios.
    
    const others = list.filter(p => p.id !== mainWinner.id);
    // Embaralha others
    const shuffledOthers = others.sort(() => 0.5 - Math.random()).slice(0, 11);
    const newSegments = [mainWinner, ...shuffledOthers];
    setWheelSegments(newSegments);

    // 3. Calcula Rotação
    // O ponteiro está no topo (0deg / 360deg).
    // O segmento 0 começa em -15deg até +15deg (se forem 12 segmentos de 30deg e centralizados).
    // O centro do segmento 0 está em 0deg (3 horas) na lógica padrão de rotação.
    // Mas, nossa conic-gradient começa em 15deg (offset).
    // Vamos alinhar: 
    // Segmento 0 (Visual Winner) deve parar no TOP (270deg de rotação visual).
    // A rotação adiciona ângulo. 
    // Se target é 270 (topo), e start é 0 (direita).
    // Rotation = 270.
    
    const segmentAngle = 360 / 12; // 30 graus
    const randomOffset = (Math.random() * 20) - 10;
    // Giro extra: 5 voltas completas (1800) + ajuste para 270 (topo)
    const targetRotation = rotation + (360 * 5) + (270 - (rotation % 360)) + randomOffset;

    setRotation(targetRotation);

    // 4. Finalização
    setTimeout(() => {
        setSpinning(false);
        setShowResults(true);
        // onFinish só quando o usuário clicar em "Confirmar" ou "Fechar" na tela de resultado
    }, 5500); // 5s spin + buffer
  };

  const confirmResult = () => {
    onFinish(drawnWinners);
  };

  return (
    <div className="modal-overlay">
      {showResults && <Confetti />}
      
      <div className="modal-content">
        
        {/* WHEEL SECTION */}
        <div className="wheel-container">
            <div className="wheel-pointer"></div>
            <div className="wheel-rotate" style={{ transform: `rotate(${rotation}deg)` }}>
                {/* Borda interna e Fundo */}
                <div className="wheel-inner-border">
                    <div className="wheel-surface"></div>
                    
                    {/* Renderizar Textos dos Segmentos */}
                    {wheelSegments.map((seg, i) => (
                        <div 
                            key={i} 
                            className="wheel-text-slot"
                            style={{ transform: `rotate(${i * (360/12) + 30}deg)` }} /* +30 para centralizar no wedge */
                        >
                            {seg.nome.split(' ')[0]}
                        </div>
                    ))}
                </div>
            </div>
            <div className="wheel-hub"></div>
        </div>

        {/* CONTROLS (Hide during result view to focus on winner) */}
        {!showResults ? (
            <>
                <div className="modal-section-title" style={{marginTop: '9rem'}}>Configuração</div>
                
                {/* Qtd Vencedores */}
                <div style={{display:'flex', justifyContent:'center', marginBottom:'1rem'}}>
                    <div className="count-control">
                        <span style={{color:'#9ca3af', fontSize:'0.75rem', marginRight:'5px'}}>SORTEAR:</span>
                        <button className="count-btn" onClick={() => setWinnerCount(Math.max(1, winnerCount - 1))}>-</button>
                        <span className="count-display">{winnerCount}</span>
                        <button className="count-btn" onClick={() => setWinnerCount(Math.min(10, winnerCount + 1))}>+</button>
                        <span style={{color:'#9ca3af', fontSize:'0.75rem', marginLeft:'5px'}}>PESSOAS</span>
                    </div>
                </div>

                <div className="filter-group" style={{marginTop:'0'}}>
                    <button className={`filter-btn ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')} disabled={spinning}>👥 Todos</button>
                    <button className={`filter-btn ${filterType === 'new' ? 'active' : ''}`} onClick={() => setFilterType('new')} disabled={spinning}>👤+ Novos</button>
                    <button className={`filter-btn ${filterType === 'present' ? 'active' : ''}`} onClick={() => setFilterType('present')} disabled={spinning}>🟢 Presentes</button>
                </div>

                {/* PRIZE */}
                <div className="modal-section-title">Prêmio</div>
                <div className="prize-display">R$ {prize},00</div>
                <input type="range" min="0" max="1000" step="50" value={prize} onChange={(e) => setPrize(Number(e.target.value))} className="custom-range" disabled={spinning}/>

                {/* ACTION BUTTON */}
                {eligibleCount > 0 ? (
                    <button className="action-btn btn-primary" onClick={handleSpin} disabled={spinning}>
                        {spinning ? 'GIRANDO...' : `GIRAR (${eligibleCount} participantes)`}
                    </button>
                ) : (
                    <button className="action-btn btn-disabled" disabled>NINGUÉM ELEGÍVEL</button>
                )}
                
                <a className="cancel-link" onClick={!spinning ? onClose : undefined}>Cancelar</a>
            </>
        ) : (
            /* RESULT VIEW */
            <div style={{marginTop: '10rem', animation: 'fadeIn 0.5s'}}>
                <h2 style={{color: 'white', marginBottom:'0.5rem'}}>🎉 PARABÉNS! 🎉</h2>
                <div style={{color: '#fbbf24', fontSize:'1.2rem', fontWeight:'bold', marginBottom:'1rem'}}>
                    R$ {prize},00
                </div>

                <div className="winner-list-container">
                    {drawnWinners.map((winner, idx) => (
                        <div key={idx} className="winner-item" style={{animationDelay: `${idx * 0.2}s`}}>
                            <div>
                                <div style={{color:'white', fontWeight:'bold'}}>{winner.nome}</div>
                                <div style={{fontSize:'0.75rem', color:'#9ca3af'}}>{winner.id_plataforma}</div>
                            </div>
                            <div style={{color:'#10b981', fontWeight:'bold'}}>#{idx+1}</div>
                        </div>
                    ))}
                </div>

                <button className="action-btn btn-primary" onClick={confirmResult}>
                    CONFIRMAR & FECHAR
                </button>
            </div>
        )}

      </div>
    </div>
  );
}

// 1. PÁGINA DE USUÁRIO
function UserPage() {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome") as string,
      email: formData.get("email") as string,
      telefone: formData.get("telefone") as string,
      cpf: formData.get("cpf") as string,
      id_plataforma: formData.get("id_plataforma") as string,
    };

    try {
      // Verifica CPF duplicado no Firestore
      // @ts-ignore
      const q = query(collection(db, "participantes"), where("cpf", "==", data.cpf));
      // @ts-ignore
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        alert("Erro: Este CPF já está cadastrado!");
      } else {
        // Insere novo participante
        // Firestore não cria created_at por padrão como SQL, então passamos aqui
        // @ts-ignore
        await addDoc(collection(db, "participantes"), {
            ...data,
            sorteado: false,
            created_at: new Date().toISOString(),
            participation_count: 1 // Começa com 1 participação
        });
        
        (e.target as HTMLFormElement).reset();
        setShowSuccess(true);
      }
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-layout">
      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="modal-overlay" style={{zIndex: 2000}}>
          <Confetti />
          <div className="modal-content" style={{maxWidth: '400px', padding: '3rem', textAlign: 'center'}}>
             <div style={{fontSize: '5rem', marginBottom: '1rem'}}>✨</div>
             <h2 style={{color: 'white', marginBottom: '0.5rem', fontSize: '2rem'}}>Cadastro Confirmado!</h2>
             <p style={{color: '#9ca3af', marginBottom: '2rem'}}>Seu nome já está na nossa lista. Fique ligado na live!</p>
             <button className="btn-yellow" onClick={() => setShowSuccess(false)}>FECHAR</button>
          </div>
        </div>
      )}

      <div className="user-card">
        <div className="brand-header">
           <div style={{color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '1px', fontSize: '0.9rem', marginBottom: '10px'}}>
             👑 SORTEIO PREMIUM
           </div>
           <h1 className="brand-title">Cadastre-se e entre na lista oficial dos sorteios do Mimoso.</h1>
           <p className="brand-subtitle">Preencha seus dados uma única vez e participe dos sorteios que o Mimoso fizer ao vivo, de forma segura, organizada e transparente.</p>
        </div>

        <div className="form-card">
          <div className="form-title">Cadastrar-se no sorteio</div>
          <p className="form-desc">Preencha com atenção. Usaremos esses dados para validar o ganhador.</p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Nome Completo *</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input name="nome" className="custom-input" placeholder="Seu nome completo" required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">WhatsApp (Com DDD) *</label>
              <div className="input-wrapper">
                <span className="input-icon">📱</span>
                <input name="telefone" className="custom-input" placeholder="(11) 99999-9999" required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">ID / Usuário da Plataforma *</label>
              <div className="input-wrapper">
                <span className="input-icon">🎮</span>
                <input name="id_plataforma" className="custom-input" placeholder="Seu ID na plataforma" required />
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div className="input-group">
                <label className="input-label">CPF *</label>
                <div className="input-wrapper">
                    <span className="input-icon">#</span>
                    <input name="cpf" className="custom-input" placeholder="000.000.000-00" required />
                </div>
                </div>
                <div className="input-group">
                <label className="input-label">Email</label>
                <div className="input-wrapper">
                    <span className="input-icon">@</span>
                    <input name="email" type="email" className="custom-input" placeholder="email@exemplo.com" required />
                </div>
                </div>
            </div>

            <div className="terms">
              <input type="checkbox" required id="terms" />
              <label htmlFor="terms">Li e aceito os termos do sorteio e autorizo o uso dos meus dados apenas para fins de validação do prêmio. <a href="#">Ver termos.</a></label>
            </div>

            <button type="submit" className="btn-yellow" disabled={loading}>
              {loading ? "Processando..." : "PARTICIPAR DO SORTEIO"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// 2. PÁGINA ADMIN
function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filter, setFilter] = useState("");
  const [showRoulette, setShowRoulette] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Monitora estado de autenticação do Firebase
    if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (user && db) {
      fetchParticipants();
    } else {
        // Fallback for visual test if db is not configured
        setParticipants(FAKE_PARTICIPANTS);
    }
  }, [user]);

  const fetchParticipants = async () => {
    if (!db) return;
    try {
        // @ts-ignore
        const q = query(collection(db, "participantes"), orderBy("created_at", "desc"));
        // @ts-ignore
        const querySnapshot = await getDocs(q);
        const realData: Participant[] = [];
        querySnapshot.forEach((doc: any) => {
            // Combina o ID do documento com os dados
            realData.push({ id: doc.id, ...doc.data() } as Participant);
        });
        setParticipants([...realData, ...FAKE_PARTICIPANTS]);
        setError(null);
    } catch (err: any) {
        console.error("Erro ao buscar participantes:", err);
        if (err.message && (err.message.includes("Cloud Firestore API has not been used") || err.code === 'permission-denied')) {
            setError("⚠️ A API do Firestore não está ativada. Acesse o Console do Firebase > Criação > Firestore Database e clique em 'Criar banco de dados'.");
        } else {
            setError("Erro ao conectar com o banco de dados: " + err.message);
        }
        // Mantém dados fakes para a UI não quebrar totalmente
        setParticipants(FAKE_PARTICIPANTS);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Backdoor mantido para compatibilidade, mas agora usamos Auth real também
    if (email === 'mimoso' && password === 'mimoso') {
      setUser({ email: 'mimoso@admin.com', uid: 'fake-admin' });
      setLoading(false);
      return;
    }

    if (!auth) {
        alert("Firebase Auth não configurado (chaves ausentes).");
        setLoading(false);
        return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      alert("Falha no login: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setUser(null);
  }

  const onRouletteFinish = async (winners: Participant[]) => {
    // Marca todos como sorteados no Firestore
    if (db) {
        try {
            for (const w of winners) {
                if (!w.id.startsWith('fake-')) {
                    // @ts-ignore
                    const participantRef = doc(db, "participantes", w.id);
                    // @ts-ignore
                    await updateDoc(participantRef, { sorteado: true });
                }
            }
        } catch (e) {
            console.error("Erro ao atualizar vencedores", e);
            alert("Erro ao salvar vencedores no banco. Verifique a conexão/permissões.");
        }
    }
    
    // Atualiza lista local
    const winnerIds = winners.map(w => w.id);
    setParticipants(prev => prev.map(p => winnerIds.includes(p.id) ? {...p, sorteado: true} : p));

    setShowRoulette(false);
  };

  if (!user) {
    return (
        <div style={{display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', position: 'relative', zIndex: 10}}>
            <div className="form-card" style={{width: '400px'}}>
                <h2 style={{color:'white', marginBottom:'20px'}}>Login Admin</h2>
                <form onSubmit={handleLogin}>
                    <div className="input-group"><input className="custom-input" placeholder="Email ou Usuário" value={email} onChange={e=>setEmail(e.target.value)}/></div>
                    <div className="input-group"><input className="custom-input" type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)}/></div>
                    <button className="btn-yellow" disabled={loading}>{loading ? 'Entrando...' : 'ENTRAR'}</button>
                </form>
            </div>
        </div>
    )
  }

  const eligibleCount = participants.filter(p => !p.sorteado).length;
  const winnerCount = participants.filter(p => p.sorteado).length;
  // FILTRO ATUALIZADO: Inclui filtro por participação
  const filtered = participants.filter(p => 
      p.nome.toLowerCase().includes(filter.toLowerCase()) || 
      p.cpf.includes(filter) || 
      p.id_plataforma.toLowerCase().includes(filter.toLowerCase()) ||
      (p.participation_count?.toString() || "1").includes(filter)
  );

  // MANIPULADORES DE AÇÃO EM MASSA
  const handleMarkAll = async () => {
    if (!confirm(`Tem certeza que deseja marcar TODOS os ${filtered.length} participantes listados como PREMIADOS?`)) return;
    
    const idsToUpdate = filtered.map(p => p.id);
    setParticipants(prev => prev.map(p => idsToUpdate.includes(p.id) ? { ...p, sorteado: true } : p));

    if (db) {
        for (const p of filtered) {
             if (!p.id.startsWith('fake-') && !p.sorteado) {
                 try {
                    // @ts-ignore
                    await updateDoc(doc(db, "participantes", p.id), { sorteado: true });
                 } catch(e) { console.error(e); }
             }
        }
    }
  };

  const handleClearAll = async () => {
     if (!confirm(`Tem certeza que deseja LIMPAR o status de sorteio de TODOS os ${filtered.length} participantes listados?`)) return;
     
     const idsToUpdate = filtered.map(p => p.id);
     setParticipants(prev => prev.map(p => idsToUpdate.includes(p.id) ? { ...p, sorteado: false } : p));
     
     if (db) {
        for (const p of filtered) {
             if (!p.id.startsWith('fake-') && p.sorteado) {
                 try {
                    // @ts-ignore
                    await updateDoc(doc(db, "participantes", p.id), { sorteado: false });
                 } catch(e) { console.error(e); }
             }
        }
    }
  };

  return (
    <div>
      {/* MODAL ROLETA */}
      {showRoulette && (
          <RouletteModal 
            participants={participants}
            onClose={() => setShowRoulette(false)}
            onFinish={onRouletteFinish}
          />
      )}

      {/* ERROR BANNER */}
      {error && (
          <div style={{background: '#ef4444', color: 'white', padding: '1rem', textAlign: 'center', fontWeight: 'bold', marginBottom: '1rem'}}>
              {error}
          </div>
      )}

      {/* Header com Botões */}
      <div className="admin-header-bar">
        <div className="live-status">
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
             <span className="live-badge">AO VIVO</span>
             <span style={{color: '#8b949e'}}>Live (09/12/2025)</span>
          </div>
          <h1 className="page-title">Sorteio Em Andamento</h1>
          <p className="page-subtitle">Em andamento - Clique em (realizar sorteio) para sortear os usuários cadastrados.</p>
        </div>
        <div className="admin-actions">
          <button className="btn-top btn-dark" onClick={handleLogout}>Sair</button>
          <button className="btn-top btn-red">⏹ Encerrar Live</button>
          <button className="btn-top btn-green" onClick={() => setShowRoulette(true)}>🎲 Abrir Roleta</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-box">
           <span className="stat-label">Total de Participantes</span>
           <span className="stat-number">{participants.length}</span>
           <div className="stat-icon" style={{color:'#10b981'}}>👥</div>
        </div>
        <div className="stat-box">
           <span className="stat-label">Elegíveis para Sorteio</span>
           <span className="stat-number" style={{color:'#8b5cf6'}}>{eligibleCount}</span>
           <div className="stat-icon" style={{color:'#8b5cf6'}}>✔</div>
        </div>
        <div className="stat-box">
           <span className="stat-label">Já foram Premiados</span>
           <span className="stat-number" style={{color:'#f59e0b'}}>{winnerCount}</span>
           <div className="stat-icon" style={{color:'#f59e0b'}}>🏆</div>
        </div>
        <div className="stat-box">
           <span className="stat-label">Total de Lives</span>
           <span className="stat-number">128</span>
           <div className="stat-icon" style={{color:'#ec4899'}}>🎁</div>
        </div>
      </div>

      {/* Data Section */}
      <div className="data-area">
        <div className="filter-bar">
           <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
              <h3 style={{color:'white', fontSize:'1rem', marginRight:'1rem'}}>Cadastros ({participants.length})</h3>
              <input className="search-input" placeholder="Buscar por nome, CPF, ID ou Nº de Lives..." value={filter} onChange={e=>setFilter(e.target.value)} />
           </div>
           <div>
              <button className="btn-top btn-dark" style={{fontSize:'0.7rem', padding: '0.5rem 1rem'}}>📥 Exportar CSV</button>
           </div>
        </div>

        {/* BULK ACTIONS */}
        <div className="bulk-actions">
            <button className="btn-sm" style={{background: '#21262d', color: '#f59e0b', border: '1px solid #f59e0b'}} onClick={handleMarkAll}>
                👑 Marcar todos como premiados
            </button>
            <button className="btn-sm" style={{background: '#21262d', color: '#ef4444', border: '1px solid #ef4444'}} onClick={handleClearAll}>
                🗑️ Limpar todos os sorteados
            </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>WhatsApp</th>
                <th>ID Plataforma</th>
                <th>CPF</th>
                <th>Data de Cadastro</th>
                <th>Participações</th>
                <th>Status de Prêmio</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{fontWeight:'bold'}}>{p.nome}</td>
                  <td>{p.telefone}</td>
                  <td><span className="tag-id">{p.id_plataforma}</span></td>
                  <td style={{color:'#8b949e'}}>{p.cpf}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>{p.participation_count || 1} Lives</td>
                  <td>{p.sorteado ? <span style={{color:'#10b981'}}>Premiado</span> : <span style={{color:'#8b949e'}}>Pendente</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// MAIN
function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  return (
    <>
      <style>{styles}</style>
      <CasinoBackground />
      <div className="content-wrapper">
        {isAdmin ? <AdminPage /> : <UserPage />}
        <button className="toggle-btn" onClick={() => setIsAdmin(!isAdmin)}>
          {isAdmin ? "Alternar para Cadastro (User)" : "Alternar para Painel Admin"}
        </button>
      </div>
    </>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);