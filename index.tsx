// Fix Black Screen & UI Layout - Stable v1.8.0
import React, { Component, useState, useEffect, useRef, FormEvent, ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
// @ts-ignore
import { initializeApp, getApps, getApp } from "firebase/app";
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
  orderBy,
  onSnapshot,
  limit
} from "firebase/firestore";
// @ts-ignore
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

// --- ERROR BOUNDARY (Evita Tela Preta) ---
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: ""
  };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error: error.toString() };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: "2rem", color: "white", textAlign: "center", background: "#02040a", height: "100vh"}}>
          <h1>Algo deu errado.</h1>
          <p>Ocorreu um erro ao renderizar a aplicação.</p>
          <pre style={{color: "#ef4444", marginTop: "1rem", whiteSpace: 'pre-wrap'}}>{this.state.error}</pre>
          <button onClick={() => window.location.reload()} style={{marginTop: "1rem", padding: "10px 20px", cursor: "pointer"}}>
            Recarregar Página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyClXYg4fERlzIy-YjacJ7K0CtIwthHGGig", // <--- TROCAR PELA SUA NOVA API KEY
  authDomain: "mimoso-test-console.firebaseapp.com",
  projectId: "mimoso-test-console",
  storageBucket: "mimoso-test-console.firebasestorage.app",
  messagingSenderId: "278829716578",
  appId: "1:278829716578:web:b2c64463ffc0f644a6ad3b"
};

// Inicializa Firebase com tratamento de erro e SINGLETON pattern
let app = null, db = null, auth = null;
let firebaseError: string | null = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  if (app) {
      try {
        db = getFirestore(app);
        auth = getAuth(app);
      } catch (serviceError: any) {
        console.warn("Erro ao carregar serviços do Firebase:", serviceError);
        firebaseError = "Erro nos serviços do banco de dados.";
      }
  }
} catch (e: any) {
  console.error("Erro crítico ao inicializar Firebase:", e);
  firebaseError = e.message || "Falha na conexão com o Banco de Dados";
}

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
  last_participation_at?: string; 
  participation_count?: number;
}

interface LiveSession {
  id: string;
  start_at: string;
  end_at: string | null;
  participant_count: number;
}

// --- DADOS FAKES (PARA VISUALIZAÇÃO) ---
const FAKE_PARTICIPANTS: Participant[] = [
  { id: 'fake-1', nome: "João 'Mimoso' Silva", email: 'joao@game.com', telefone: '(11) 99999-1234', cpf: '123.***.***-00', id_plataforma: 'JoaoGamer_YT', sorteado: false, created_at: new Date().toISOString(), last_participation_at: new Date().toISOString(), participation_count: 12 },
  { id: 'fake-2', nome: 'Maria Sorte', email: 'maria@sorte.com', telefone: '(21) 98888-5678', cpf: '456.***.***-11', id_plataforma: 'MaryLucky', sorteado: true, created_at: new Date(Date.now() - 10000000).toISOString(), participation_count: 5 },
  { id: 'fake-3', nome: 'Pedro Apostador', email: 'pedro@bet.com', telefone: '(31) 97777-9012', cpf: '789.***.***-22', id_plataforma: 'PedrinhoBet', sorteado: false, created_at: new Date(Date.now() - 5000000).toISOString(), participation_count: 3 },
  { id: 'fake-4', nome: 'Ana Streamer', email: 'ana@live.com', telefone: '(41) 96666-3456', cpf: '321.***.***-33', id_plataforma: 'AnaLiveON', sorteado: false, created_at: new Date(Date.now() - 200000).toISOString(), participation_count: 1 },
  { id: 'fake-5', nome: 'Carlos Vencedor', email: 'carlos@win.com', telefone: '(51) 95555-7890', cpf: '654.***.***-44', id_plataforma: 'CarlinhosVencedor', sorteado: false, created_at: new Date(Date.now() - 3600000).toISOString(), participation_count: 8 },
  { id: 'fake-6', nome: 'Lucas Player', email: 'lucas@play.com', telefone: '(11) 94444-1111', cpf: '987.***.***-55', id_plataforma: 'LucasP_007', sorteado: false, created_at: new Date(Date.now() - 86400000).toISOString(), participation_count: 2 },
  { id: 'fake-7', nome: 'Fernanda Games', email: 'fer@games.com', telefone: '(71) 93333-2222', cpf: '159.***.***-66', id_plataforma: 'Nanda_Gamer', sorteado: false, created_at: new Date(Date.now() - 40000000).toISOString(), participation_count: 15 },
  { id: 'fake-8', nome: 'Roberto Firmino', email: 'beto@futa.com', telefone: '(81) 92222-3333', cpf: '777.***.***-77', id_plataforma: 'BetoGoal', sorteado: false, created_at: new Date(Date.now() - 100000).toISOString(), last_participation_at: new Date().toISOString(), participation_count: 2 },
  { id: 'fake-9', nome: 'Julia Roberts', email: 'ju@movie.com', telefone: '(11) 91111-2222', cpf: '888.***.***-88', id_plataforma: 'JuCine', sorteado: false, created_at: new Date(Date.now() - 900000).toISOString(), participation_count: 4 },
  { id: 'fake-10', nome: 'Goku Silva', email: 'goku@dbz.com', telefone: '(99) 99999-9999', cpf: '999.***.***-99', id_plataforma: 'Kakaroto123', sorteado: false, created_at: new Date(Date.now() - 50000).toISOString(), last_participation_at: new Date().toISOString(), participation_count: 42 },
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
  position: relative; z-index: 40;
}
.live-status { display: flex; flex-direction: column; gap: 0.5rem; }
.live-badge {
  background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; 
  font-weight: 800; font-size: 0.75rem; text-transform: uppercase; display: inline-block; width: fit-content;
}
.live-badge.off { background: #374151; color: #9ca3af; }

.page-title { font-size: 2rem; font-weight: 800; color: #fff; margin: 0; }
.page-subtitle { color: var(--text-muted); font-size: 0.9rem; }

.realtime-indicator {
    display: flex; align-items: center; gap: 6px; font-size: 0.75rem; 
    color: var(--admin-green); background: rgba(16, 185, 129, 0.1); 
    padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);
}
.pulsing-dot {
    width: 8px; height: 8px; background-color: var(--admin-green); border-radius: 50%;
    animation: pulse 1.5s infinite;
}
@keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.admin-actions { display: flex; gap: 1rem; align-items: center; position: relative; z-index: 50; }
.timer-display {
  font-family: monospace; font-size: 1.2rem; font-weight: bold; color: var(--primary);
  background: #1f2937; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid #374151;
}

/* ESTILO PREMIUM PARA O TÍTULO MIMOSO */
.mimoso-brand {
  font-size: 2.5rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-right: 1.5rem;
  
  /* Gradient text effect */
  background: linear-gradient(90deg, #fbbf24, #f59e0b, #ef4444, #f59e0b, #fbbf24);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  
  /* Animation */
  animation: shine 4s linear infinite;
  
  /* Glow/Shadow */
  filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.4));
}

@keyframes shine {
  to {
    background-position: 200% center;
  }
}

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
  transition: transform 0.2s;
}
.stat-box.clickable { cursor: pointer; }
.stat-box.clickable:hover { border-color: var(--primary); transform: translateY(-2px); }

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
.table-tabs { display: flex; gap: 10px; }
.tab-btn {
  background: transparent; color: #8b949e; border: none; padding: 8px 16px; 
  cursor: pointer; font-weight: 600; font-size: 0.9rem; border-radius: 6px;
  transition: all 0.2s;
}
.tab-btn.active { background: rgba(251, 191, 36, 0.1); color: var(--primary); }
.tab-btn:hover { color: white; }

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

/* --- ROULETTE MODAL STYLES (SIDE BY SIDE) --- */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.92); backdrop-filter: blur(8px);
  z-index: 100; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  overflow-y: auto;
  padding: 2rem;
}

.modal-content {
  background: linear-gradient(180deg, #161b22 0%, #0d1117 100%);
  border: 1px solid #30363d;
  border-radius: 24px;
  width: 100%; max-width: 1100px;
  padding: 3rem;
  position: relative;
  box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: row;
  gap: 4rem;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

@media (max-width: 1024px) {
  .modal-content {
    flex-direction: column;
    gap: 2rem;
    padding: 2rem 1rem;
    max-width: 500px;
    margin: auto;
  }
}

.wheel-column {
    flex-shrink: 0;
    position: relative;
    width: 500px; height: 500px;
    display: flex; align-items: center; justify-content: center;
}

@media (max-width: 600px) {
    .wheel-column {
        width: 350px; height: 350px;
    }
}

.controls-column {
    flex: 1;
    width: 100%;
    max-width: 450px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.wheel-container {
  position: relative; 
  width: 100%; height: 100%;
  z-index: 10;
  pointer-events: none;
  filter: drop-shadow(0 0 40px rgba(251, 191, 36, 0.15));
}

.pointers-layer {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 25;
    pointer-events: none;
}

.wheel-pointer-wrapper {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
}

.wheel-pointer {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px; height: 50px;
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
  padding: 12px; 
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

.wheel-surface {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
}

.wheel-text-slot {
  position: absolute;
  top: 50%; left: 50%;
  width: 42%; height: 0px; 
  transform-origin: 0% 50%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 15px;
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
  margin-top: 1rem;
  flex-wrap: wrap;
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

.import-container {
  margin-top: 1rem;
  background: #161b22;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #30363d;
}
.import-textarea {
  width: 100%;
  height: 100px;
  background: #010409;
  border: 1px solid #30363d;
  color: #e6edf3;
  padding: 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
  resize: none;
}
.import-actions {
  display: flex; gap: 0.5rem; margin-top: 0.5rem;
}

.winner-list-container {
  max-height: 200px; overflow-y: auto; text-align: left; width: 100%;
  background: rgba(0,0,0,0.3); border-radius: 8px; padding: 1rem;
  margin-bottom: 1rem;
}
.winner-item {
  padding: 0.5rem; border-bottom: 1px solid #374151; display: flex; justify-content: space-between;
  animation: fadeIn 0.5s ease forwards; opacity: 0;
}
@keyframes fadeIn { to { opacity: 1; } }

.confetti-canvas {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999;
}

.history-table {
  width: 100%; border-collapse: collapse; margin-top: 1rem;
}
.history-table th { text-align: left; font-size: 0.75rem; color: #8b949e; padding-bottom: 0.5rem; border-bottom: 1px solid #30363d; }
.history-table td { padding: 0.75rem 0; color: #e6edf3; font-size: 0.9rem; border-bottom: 1px solid #21262d; }
`;

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full screen
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: any[] = [];
    const colors = ['#fbbf24', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        speedY: Math.random() * 3 + 2,
        speedX: Math.random() * 2 - 1,
        rotation: Math.random() * 360
      });
    }

    let animationId: number;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += 5;
        
        if (p.y > canvas.height) {
             p.y = -20;
             p.x = Math.random() * canvas.width;
        }
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      
      animationId = requestAnimationFrame(animate);
    }
    
    animate();
    return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resize);
    };
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

// Helper para formatar duração
function formatDuration(start: string, end: string | null) {
  if (!end) return "Em andamento";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Modal Histórico de Lives
function HistoryModal({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!db) { setLoading(false); return; }
      try {
        // @ts-ignore
        const q = query(collection(db, "lives"), orderBy("start_at", "desc"), limit(50));
        // @ts-ignore
        const snapshot = await getDocs(q);
        const data: LiveSession[] = [];
        snapshot.forEach((doc: any) => {
           data.push({ id: doc.id, ...doc.data() });
        });
        setHistory(data);
      } catch (e) {
        console.error("Erro ao carregar historico", e);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{maxWidth: '600px', flexDirection: 'column', gap: '1rem'}}>
        <div style={{width: '100%', textAlign: 'left'}}>
            <h2 style={{color: 'white', marginBottom: '0.5rem'}}>Histórico de Lives</h2>
            <p style={{color: '#8b949e', fontSize: '0.9rem', marginBottom: '1.5rem'}}>
            Registro das últimas sessões realizadas.
            </p>
        </div>

        {loading ? (
          <div style={{color: 'white', textAlign: 'center', padding: '2rem'}}>Carregando...</div>
        ) : history.length === 0 ? (
           <div style={{color: '#8b949e', textAlign: 'center', padding: '2rem'}}>Nenhum histórico encontrado.</div>
        ) : (
          <div style={{maxHeight: '400px', overflowY: 'auto', width: '100%'}}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Horário Início</th>
                  <th>Duração</th>
                  <th>Participantes</th>
                </tr>
              </thead>
              <tbody>
                {history.map(session => (
                  <tr key={session.id}>
                    <td>{new Date(session.start_at).toLocaleDateString()}</td>
                    <td>{new Date(session.start_at).toLocaleTimeString()}</td>
                    <td>{formatDuration(session.start_at, session.end_at)}</td>
                    <td style={{fontWeight: 'bold', color: '#fbbf24'}}>{session.participant_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div style={{textAlign: 'center', marginTop: '1.5rem'}}>
             <button className="btn-dark" onClick={onClose} style={{padding: '0.5rem 2rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid #30363d', color: 'white'}}>Fechar</button>
        </div>
      </div>
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
  const [filterType, setFilterType] = useState<'all' | 'new' | 'present' | 'custom'>('all');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  
  // Custom Import State
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [customParticipants, setCustomParticipants] = useState<Participant[]>([]);
  
  // Controle de estado para mostrar resultados
  const [showResults, setShowResults] = useState(false);
  const [drawnWinners, setDrawnWinners] = useState<Participant[]>([]);
  const [wheelSegments, setWheelSegments] = useState<Participant[]>([]);
  const [segmentAngle, setSegmentAngle] = useState(0);

  // Lógica de Filtro
  const getFilteredParticipants = () => {
    // Se o filtro for customizado (Lista importada do Facebook)
    if (filterType === 'custom') {
      return customParticipants.filter(p => !p.sorteado);
    }

    let list = participants.filter(p => !p.sorteado);
    
    // Define 24h atrás para considerar "Recente/Hoje"
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (filterType === 'new') {
      // APENAS quem criou a conta nas últimas 24h
      list = list.filter(p => new Date(p.created_at) > oneDayAgo);
    } else if (filterType === 'present') {
      // Quem participou nas últimas 24h (seja criando conta ou fazendo check-in)
      list = list.filter(p => {
          const lastActivity = p.last_participation_at ? new Date(p.last_participation_at) : new Date(p.created_at);
          return lastActivity > oneDayAgo;
      });
    }
    // 'all' já pega todos que !p.sorteado
    
    return list;
  };

  const eligibleCount = getFilteredParticipants().length;

  // Atualiza os segmentos visuais da roleta quando a lista muda
  useEffect(() => {
    const list = getFilteredParticipants();
    let displayList: Participant[] = [];
    
    if (list.length > 0) {
        // Se a lista for muito pequena (ex: 2 pessoas), duplicamos para preencher a roleta visualmente
        if (list.length < 8) {
             while(displayList.length < 8) {
                 displayList = [...displayList, ...list];
             }
        } else {
             displayList = [...list];
        }
    }

    // Embaralha para que não fiquem em ordem alfabética ou de entrada (mais justo visualmente)
    // Usamos um seed simples ou apenas sort random para renderizar
    const shuffled = [...displayList].sort(() => Math.random() - 0.5);
    setWheelSegments(shuffled);
    
    if (shuffled.length > 0) {
        setSegmentAngle(360 / shuffled.length);
    } else {
        setSegmentAngle(0);
    }
  }, [filterType, participants, customParticipants]);

  const handleImportList = () => {
    if (!importText.trim()) return;
    
    const lines = importText.split('\n').filter(l => l.trim().length > 0);
    const imported: Participant[] = lines.map((name, index) => ({
        id: `fb-import-${Date.now()}-${index}`,
        nome: name.trim(),
        email: 'facebook-import',
        telefone: '',
        cpf: '',
        id_plataforma: 'Facebook',
        sorteado: false,
        created_at: new Date().toISOString()
    }));

    setCustomParticipants(imported);
    setFilterType('custom');
    setShowImport(false);
  };

  const handleSpin = () => {
    if (wheelSegments.length === 0) return;
    if (segmentAngle === 0) return; // Prevent division by zero crash

    setSpinning(true);
    setShowResults(false);
    setDrawnWinners([]);

    // 1. Gira a roleta para uma posição aleatória (Física)
    // Gira pelo menos 5 voltas (1800 deg) + um valor aleatório entre 0 e 360
    const extraSpins = 360 * 5; 
    const randomStopAngle = Math.floor(Math.random() * 360);
    const targetRotation = rotation + extraSpins + randomStopAngle;

    setRotation(targetRotation);

    // 2. Calcula os vencedores baseado onde as setas "estão" em relação a rotação final
    // Importante: A rotação é aplicada ao container da roleta.
    // As setas estão fixas no topo (ou distribuídas).
    // O ângulo efetivo de uma seta K é: (AngleSeta - RotationFinal) % 360
    
    const finalAngleNormalized = targetRotation % 360; // Posição que a roleta parou (0-360)
    
    // Calcula vencedores após o tempo de giro
    setTimeout(() => {
        const currentWinners: Participant[] = [];
        
        // Para cada seta, calculamos quem está embaixo dela
        for (let i = 0; i < winnerCount; i++) {
            // Ângulo visual da seta (0 deg = topo, 120 deg = direita-baixo, etc)
            const pointerAngle = i * (360 / winnerCount);
            
            // O segmento vencedor é aquele que, quando a roleta está girada em `finalAngleNormalized`,
            // cobre a posição `pointerAngle`.
            // Matemática inversa: O ângulo na roleta que está alinhado com o ponteiro
            // Roleta gira horário (+). 
            // AnguloDaFatiaNaRoleta = (PointerAngle - finalAngleNormalized)
            // Precisamos normalizar para 0-360 positivo
            
            let effectiveAngle = (pointerAngle - finalAngleNormalized) % 360;
            if (effectiveAngle < 0) effectiveAngle += 360; // Garante positivo
            
            // Mas espere! A conic-gradient começa em 0? Não, geralmente o CSS Conic começa no topo (0deg) ou direita (90deg)?
            // CSS conic-gradient começa no topo (0deg) e gira horário.
            // Nossa roleta visual: transform rotate() gira horário.
            // Segmento 0 começa em 0deg e vai até segmentAngle.
            
            // Então, quem está em 'effectiveAngle'?
            // Index = floor(effectiveAngle / segmentAngle)
            
            // *Ajuste Fino*: O CSS conic-gradient foi configurado com offset?
            // No código antigo: from 15deg. Vamos remover o offset fixo e fazer dinâmico no render
            // para simplificar a matemática. Vamos assumir start em 0deg.
            
            const winnerIndex = Math.floor(effectiveAngle / segmentAngle);
            
            // Proteção contra index out of bounds (arredondamento)
            const safeIndex = winnerIndex % wheelSegments.length;
            if (wheelSegments[safeIndex]) {
                 currentWinners.push(wheelSegments[safeIndex]);
            }
        }

        setDrawnWinners(currentWinners);
        setSpinning(false);
        setShowResults(true);
    }, 5500); 
  };

  const confirmResult = () => {
    // Se for custom, marcamos sorteado localmente na lista custom
    if (filterType === 'custom') {
        const winnerIds = drawnWinners.map(w => w.id);
        setCustomParticipants(prev => prev.map(p => winnerIds.includes(p.id) ? {...p, sorteado: true} : p));
        setShowResults(false);
    } else {
        onFinish(drawnWinners);
    }
  };

  // Generate CSS Conic Gradient dynamically
  const generateGradient = () => {
     if (wheelSegments.length === 0) return 'none';
     // Alternating colors
     const colors = wheelSegments.map((_, i) => {
         const color = i % 2 === 0 ? '#991b1b' : '#111827';
         const start = i * segmentAngle;
         const end = (i + 1) * segmentAngle;
         return `${color} ${start}deg ${end}deg`;
     }).join(', ');
     return `conic-gradient(${colors})`;
  };

  // Adjust font size based on count
  const getFontSize = () => {
      if (wheelSegments.length > 50) return '0.4rem';
      if (wheelSegments.length > 30) return '0.5rem';
      if (wheelSegments.length > 12) return '0.65rem';
      return '0.85rem';
  };

  return (
    <div className="modal-overlay">
      {showResults && <Confetti />}
      
      <div className="modal-content">
        
        {/* WHEEL SECTION (LEFT COLUMN) */}
        <div className="wheel-column">
            <div className="wheel-container">
                {/* DYNAMIC POINTERS */}
                <div className="pointers-layer">
                    {Array.from({ length: winnerCount }).map((_, i) => (
                        <div 
                            key={i} 
                            className="wheel-pointer-wrapper" 
                            style={{ transform: `rotate(${i * (360 / winnerCount)}deg)` }}
                        >
                            <div className="wheel-pointer"></div>
                        </div>
                    ))}
                </div>

                <div className="wheel-rotate" style={{ transform: `rotate(${rotation}deg)` }}>
                    {/* Borda interna e Fundo */}
                    <div className="wheel-inner-border">
                        <div className="wheel-surface" style={{ background: generateGradient() }}></div>
                        
                        {/* Renderizar Textos dos Segmentos */}
                        {wheelSegments.map((seg, i) => (
                            <div 
                                key={i} 
                                className="wheel-text-slot"
                                style={{ 
                                    transform: `rotate(${i * segmentAngle + (segmentAngle/2)}deg)`, // Center text in slice
                                    height: '0px', // Origin point
                                    fontSize: getFontSize()
                                }} 
                            >
                                {/* Truncate long names if many segments */}
                                {wheelSegments.length > 30 ? seg.nome.substring(0, 10) + '..' : seg.nome.split(' ')[0]}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="wheel-hub"></div>
            </div>
        </div>

        {/* CONTROLS (RIGHT COLUMN) */}
        <div className="controls-column">
            {!showResults ? (
                <>
                    <div className="modal-section-title" style={{marginTop: 0}}>Configuração</div>
                    
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
                        <button className={`filter-btn ${filterType === 'all' ? 'active' : ''}`} onClick={() => {setFilterType('all'); setShowImport(false);}} disabled={spinning}>👥 Todos</button>
                        <button className={`filter-btn ${filterType === 'new' ? 'active' : ''}`} onClick={() => {setFilterType('new'); setShowImport(false);}} disabled={spinning}>👶 Novos</button>
                        <button className={`filter-btn ${filterType === 'present' ? 'active' : ''}`} onClick={() => {setFilterType('present'); setShowImport(false);}} disabled={spinning}>🟢 Presentes</button>
                        <button className={`filter-btn ${filterType === 'custom' ? 'active' : ''}`} onClick={() => {setShowImport(true);}} disabled={spinning}>📋 Lista</button>
                    </div>

                    {/* AREA DE IMPORTAÇÃO */}
                    {showImport && (
                        <div className="import-container" style={{width: '100%'}}>
                            <div style={{fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.5rem', textAlign: 'left'}}>
                                Cole os nomes aqui (um por linha):
                            </div>
                            <textarea 
                                className="import-textarea"
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                placeholder="Ex:&#10;Maria Silva&#10;João Souza&#10;Pedro Gamer"
                            />
                            <div className="import-actions">
                                <button className="btn-sm" style={{background: '#1f2937', color: 'white', flex: 1}} onClick={() => setShowImport(false)}>Cancelar</button>
                                <button className="btn-sm" style={{background: '#fbbf24', color: '#000', flex: 1}} onClick={handleImportList}>Carregar</button>
                            </div>
                        </div>
                    )}

                    {/* PRIZE */}
                    <div className="modal-section-title">Prêmio</div>
                    <div className="prize-display">R$ {prize},00</div>
                    <input type="range" min="0" max="1000" step="5" value={prize} onChange={(e) => setPrize(Number(e.target.value))} className="custom-range" disabled={spinning}/>

                    {/* ACTION BUTTON */}
                    {eligibleCount > 0 ? (
                        <button className="action-btn btn-primary" onClick={handleSpin} disabled={spinning}>
                            {spinning ? 'GIRANDO...' : `GIRAR (${eligibleCount})`}
                        </button>
                    ) : (
                        <button className="action-btn btn-disabled" disabled>NINGUÉM ELEGÍVEL</button>
                    )}
                    
                    <a className="cancel-link" onClick={!spinning ? onClose : undefined}>Cancelar</a>
                </>
            ) : (
                /* RESULT VIEW */
                <div style={{marginTop: 0, animation: 'fadeIn 0.5s', width: '100%'}}>
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

                    <div style={{display: 'flex', gap: '10px', marginTop: '1rem', width: '100%'}}>
                        <button className="action-btn" style={{background: '#374151', color: 'white', fontSize: '0.9rem'}} onClick={() => setShowResults(false)}>
                            🔄 Girar Novamente
                        </button>
                        <button className="action-btn btn-primary" style={{fontSize: '0.9rem'}} onClick={confirmResult}>
                            CONFIRMAR
                        </button>
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}

// 1. PÁGINA DE USUÁRIO
function UserPage() {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: "Cadastro Confirmado!", text: "Seu nome já está na nossa lista. Fique ligado na live!" });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    if (!db) {
        alert("Erro: Banco de dados não conectado. Verifique se criou seu projeto no Firebase Console.");
        setLoading(false);
        return;
    }

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
        // --- LÓGICA DE REENTRADA ---
        const existingDoc = querySnapshot.docs[0];
        const existingData = existingDoc.data();
        const newCount = (existingData.participation_count || 1) + 1;
        
        // @ts-ignore
        await updateDoc(doc(db, "participantes", existingDoc.id), {
            ...data, // Atualiza dados caso tenham mudado
            participation_count: newCount,
            sorteado: false, // Reseta status para poder ganhar novamente
            last_participation_at: new Date().toISOString() // Marca que participou hoje
        });

        setSuccessMessage({
            title: "Participação Registrada!",
            text: `Bem-vindo de volta! Você já tem ${newCount} participações confirmadas.`
        });
      } else {
        // --- NOVO CADASTRO ---
        // @ts-ignore
        await addDoc(collection(db, "participantes"), {
            ...data,
            sorteado: false,
            created_at: new Date().toISOString(),
            last_participation_at: new Date().toISOString(),
            participation_count: 1
        });
        
        setSuccessMessage({
            title: "Cadastro Confirmado!",
            text: "Seu nome já está na nossa lista. Fique ligado na live!"
        });
      }
      
      (e.target as HTMLFormElement).reset();
      setShowSuccess(true);
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
             <h2 style={{color: 'white', marginBottom: '0.5rem', fontSize: '2rem'}}>{successMessage.title}</h2>
             <p style={{color: '#9ca3af', marginBottom: '2rem'}}>{successMessage.text}</p>
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
          
          {firebaseError && (
              <div style={{padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem'}}>
                  ⚠️ <b>Modo Demonstração (Sem Banco):</b> {firebaseError} <br/>
                  Crie um projeto no Firebase Console e troque as chaves no código.
              </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Nome Completo *</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input name="nome" className="custom-input" placeholder="Seu nome completo" required disabled={!!firebaseError} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">WhatsApp (Com DDD) *</label>
              <div className="input-wrapper">
                <span className="input-icon">📱</span>
                <input name="telefone" className="custom-input" placeholder="(11) 99999-9999" required disabled={!!firebaseError} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">ID / Usuário da Plataforma *</label>
              <div className="input-wrapper">
                <span className="input-icon">🎮</span>
                <input name="id_plataforma" className="custom-input" placeholder="Seu ID na plataforma" required disabled={!!firebaseError} />
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div className="input-group">
                <label className="input-label">CPF *</label>
                <div className="input-wrapper">
                    <span className="input-icon">#</span>
                    <input name="cpf" className="custom-input" placeholder="000.000.000-00" required disabled={!!firebaseError} />
                </div>
                </div>
                <div className="input-group">
                <label className="input-label">Email</label>
                <div className="input-wrapper">
                    <span className="input-icon">@</span>
                    <input name="email" type="email" className="custom-input" placeholder="email@exemplo.com" required disabled={!!firebaseError} />
                </div>
                </div>
            </div>

            <div className="terms">
              <input type="checkbox" required id="terms" disabled={!!firebaseError} />
              <label htmlFor="terms">Li e aceito os termos do sorteio e autorizo o uso dos meus dados apenas para fins de validação do prêmio. <a href="#">Ver termos.</a></label>
            </div>

            <button type="submit" className="btn-yellow" disabled={loading || !!firebaseError}>
              {loading ? "Processando..." : (!!firebaseError ? "BANCO DESCONECTADO" : "PARTICIPAR DO SORTEIO")}
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
  const [showHistory, setShowHistory] = useState(false);
  
  // LIVE STATE
  const [activeLive, setActiveLive] = useState<LiveSession | null>(null);
  const [timerStr, setTimerStr] = useState("00:00:00");
  const [processingLive, setProcessingLive] = useState(false); 
  const timerRef = useRef<any>(null);

  // VIEW STATE
  const [viewFilter, setViewFilter] = useState<'all' | 'new' | 'present'>('all');

  useEffect(() => {
    // Monitora estado de autenticação do Firebase
    if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }
  }, []);

  // Monitora Participantes
  useEffect(() => {
    if (user && db) {
        // @ts-ignore
        const q = query(collection(db, "participantes"), orderBy("created_at", "desc"));
        // @ts-ignore
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const realData: Participant[] = [];
            querySnapshot.forEach((doc: any) => {
                realData.push({ id: doc.id, ...doc.data() } as Participant);
            });
            setParticipants([...realData, ...FAKE_PARTICIPANTS]);
            setError(null);
        }, (err: any) => {
            console.error(err);
            setError("Erro ao conectar realtime (Verifique permissões do Firestore no Console)");
        });
        return () => unsubscribe();
    } else {
        setParticipants(FAKE_PARTICIPANTS);
    }
  }, [user]);

  // Monitora Lives Ativas
  useEffect(() => {
      if (user && db) {
          // Busca live onde end_at == null
          // @ts-ignore
          const q = query(collection(db, "lives"), where("end_at", "==", null));
          // @ts-ignore
          const unsubscribe = onSnapshot(q, (snapshot) => {
              if (!snapshot.empty) {
                  const docData = snapshot.docs[0];
                  setActiveLive({ id: docData.id, ...docData.data() } as LiveSession);
              } else {
                  setActiveLive(null);
              }
          });
          return () => unsubscribe();
      }
  }, [user]);

  // Timer Logic
  useEffect(() => {
    if (activeLive) {
        const start = new Date(activeLive.start_at).getTime();
        timerRef.current = setInterval(() => {
            const now = Date.now();
            const diff = now - start;
            if (isNaN(diff)) return;
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimerStr(
                `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`
            );
        }, 1000);
    } else {
        clearInterval(timerRef.current);
        setTimerStr("00:00:00");
    }
    return () => clearInterval(timerRef.current);
  }, [activeLive]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (email === 'mimoso' && password === 'mimosex2000') {
      setUser({ email: 'mimoso@admin.com', uid: 'fake-admin' });
      setLoading(false);
      return;
    }
    if (!auth) {
        alert("Firebase Auth não conectado (Crie um novo projeto no Console).");
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
            console.error(e);
        }
    }
    const winnerIds = winners.map(w => w.id);
    setParticipants(prev => prev.map(p => winnerIds.includes(p.id) ? {...p, sorteado: true} : p));
    setShowRoulette(false);
  };

  // CSV Export
  const exportCSV = () => {
    // Headers
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nome,Email,Telefone,CPF,ID Plataforma,Participacoes,Data Cadastro,Status\n";

    // Data - usa 'filtered' que já respeita os filtros de visualização (Novos/Presentes)
    filtered.forEach(p => {
        const row = [
            `"${p.nome}"`,
            p.email,
            p.telefone,
            p.cpf,
            p.id_plataforma,
            p.participation_count || 1,
            new Date(p.created_at).toLocaleDateString(),
            p.sorteado ? "Premiado" : "Pendente"
        ].join(",");
        csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `participantes_${viewFilter}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) {
    return (
        <div style={{display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', position: 'relative', zIndex: 10}}>
            <div className="form-card" style={{width: '400px'}}>
                <h2 style={{color:'white', marginBottom:'20px'}}>Login Admin</h2>
                {firebaseError && (
                    <div style={{background: '#ef4444', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '10px', fontSize: '0.8rem'}}>
                        <b>Modo Demonstração (Sem Banco):</b> {firebaseError}
                    </div>
                )}
                <form onSubmit={handleLogin}>
                    <div className="input-group"><input className="custom-input" placeholder="Email ou Usuário" value={email} onChange={e=>setEmail(e.target.value)}/></div>
                    <div className="input-group"><input className="custom-input" type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)}/></div>
                    <button className="btn-yellow" disabled={loading}>{loading ? 'Entrando...' : 'ENTRAR'}</button>
                </form>
            </div>
        </div>
    )
  }

  // --- LOGICA DE FILTRO DA TABELA ---
  const eligibleCount = participants.filter(p => !p.sorteado).length;
  const winnerCount = participants.filter(p => p.sorteado).length;
  
  let displayedParticipants = participants;
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (viewFilter === 'new') {
      displayedParticipants = participants.filter(p => new Date(p.created_at) > oneDayAgo);
  } else if (viewFilter === 'present') {
      displayedParticipants = participants.filter(p => {
          const lastActivity = p.last_participation_at ? new Date(p.last_participation_at) : new Date(p.created_at);
          return lastActivity > oneDayAgo;
      });
  }

  const filtered = displayedParticipants.filter(p => 
      p.nome.toLowerCase().includes(filter.toLowerCase()) || 
      p.cpf.includes(filter) || 
      p.id_plataforma.toLowerCase().includes(filter.toLowerCase()) ||
      (p.participation_count?.toString() || "1").includes(filter)
  );

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
      {/* MODALS */}
      {showRoulette && (
          <RouletteModal 
            participants={participants}
            onClose={() => setShowRoulette(false)}
            onFinish={onRouletteFinish}
          />
      )}

      {showHistory && (
          <HistoryModal onClose={() => setShowHistory(false)} />
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
             <span className={`live-badge ${activeLive ? '' : 'off'}`}>
                 {activeLive ? 'AO VIVO' : 'OFFLINE'}
             </span>
             {/* Indicador de Realtime */}
             {db && activeLive && (
                 <div className="realtime-indicator">
                     <div className="pulsing-dot"></div>
                     <span>Transmissão Ativa</span>
                 </div>
             )}
          </div>
          <h1 className="page-title">Painel de Controle</h1>
          <p className="page-subtitle">Gerencie o sorteio e visualize cadastros em tempo real.</p>
        </div>
        <div className="admin-actions">
          {/* REMOVED TIMER AS REQUESTED */}
          {/* {activeLive && <div className="timer-display">{timerStr}</div>} */}
          
          <div className="mimoso-brand">
            Sorteios do Mimoso
          </div>
          
          <button className="btn-top btn-dark" onClick={handleLogout}>Sair</button>
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
        <div className="stat-box clickable" onClick={() => setShowHistory(true)}>
           <span className="stat-label">Histórico de Lives (Ver)</span>
           <span className="stat-number" style={{fontSize: '1.5rem'}}>Ver Relatórios</span>
           <div className="stat-icon" style={{color:'#ec4899'}}>🎁</div>
        </div>
      </div>

      {/* Data Section */}
      <div className="data-area">
        <div className="filter-bar">
           <div className="table-tabs">
                <button className={`tab-btn ${viewFilter === 'all' ? 'active' : ''}`} onClick={() => setViewFilter('all')}>Todos</button>
                <button className={`tab-btn ${viewFilter === 'new' ? 'active' : ''}`} onClick={() => setViewFilter('new')}>Novos (Hoje)</button>
                <button className={`tab-btn ${viewFilter === 'present' ? 'active' : ''}`} onClick={() => setViewFilter('present')}>Presentes (Hoje)</button>
           </div>
           
           <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
              <input className="search-input" placeholder="Buscar..." value={filter} onChange={e=>setFilter(e.target.value)} />
              <button className="btn-top btn-dark" onClick={exportCSV} style={{fontSize:'0.7rem', padding: '0.5rem 1rem'}}>📥 CSV</button>
           </div>
        </div>

        {/* BULK ACTIONS */}
        <div className="bulk-actions">
            <button className="btn-sm" style={{background: '#21262d', color: '#f59e0b', border: '1px solid #f59e0b'}} onClick={handleMarkAll}>
                👑 Marcar listados como premiados
            </button>
            <button className="btn-sm" style={{background: '#21262d', color: '#ef4444', border: '1px solid #ef4444'}} onClick={handleClearAll}>
                🗑️ Limpar listados
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
                <th>Status</th>
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
    <ErrorBoundary>
      <style>{styles}</style>
      <CasinoBackground />
      <div className="content-wrapper">
        {isAdmin ? <AdminPage /> : <UserPage />}
        <button className="toggle-btn" onClick={() => setIsAdmin(!isAdmin)}>
          {isAdmin ? "Alternar para Cadastro (User)" : "Alternar para Painel Admin"}
        </button>
      </div>
    </ErrorBoundary>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);