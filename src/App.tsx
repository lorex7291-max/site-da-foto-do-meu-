import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Camera,
  Check,
  Copy,
  Download,
  ExternalLink,
  Heart,
  ImageOff,
  ImagePlus,
  Link2,
  QrCode,
  RefreshCw,
  ScanLine,
  Sparkles,
} from "lucide-react";

type Memory = {
  imageUrl: string;
  title: string;
  message: string;
};

const STORAGE_KEY = "entre-nos:memoria:v1";
const DEFAULT_MEMORY: Memory = {
  imageUrl: "",
  title: "Uma lembrança nossa",
  message: "Alguns momentos são tão especiais que merecem ficar guardados para sempre.",
};

function isValidPhotoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

function readSavedMemory(): Memory {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_MEMORY;
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") return DEFAULT_MEMORY;
    const item = parsed as Partial<Memory>;
    return {
      imageUrl: typeof item.imageUrl === "string" ? item.imageUrl.slice(0, 500) : "",
      title: typeof item.title === "string" ? item.title.slice(0, 48) : DEFAULT_MEMORY.title,
      message: typeof item.message === "string" ? item.message.slice(0, 120) : DEFAULT_MEMORY.message,
    };
  } catch {
    return DEFAULT_MEMORY;
  }
}

function getPhotoMemory(): Memory | null {
  const search = new URLSearchParams(window.location.search);
  if (search.get("ver") !== "foto") return null;
  return {
    imageUrl: (search.get("imagem") ?? "").slice(0, 800),
    title: (search.get("titulo") ?? DEFAULT_MEMORY.title).slice(0, 48),
    message: (search.get("mensagem") ?? "").slice(0, 120),
  };
}

function createShareUrl(memory: Memory): string {
  const url = new URL(window.location.href);
  url.hash = "";
  url.search = "";
  url.searchParams.set("ver", "foto");
  url.searchParams.set("imagem", memory.imageUrl);
  if (memory.title) url.searchParams.set("titulo", memory.title);
  if (memory.message) url.searchParams.set("mensagem", memory.message);
  return url.toString();
}

function Brand() {
  return (
    <a className="brand" href={window.location.pathname} aria-label="Entre Nós, voltar ao início">
      <span className="brand-mark"><Heart size={19} strokeWidth={1.8} fill="currentColor" aria-hidden="true" /></span>
      <span>entre<span className="brand-italic">nós</span><span className="brand-period">.</span></span>
    </a>
  );
}

function Header({ viewing = false }: { viewing?: boolean }) {
  return (
    <header className="site-header page-shell">
      <Brand />
      <div className="header-right">
        <span className="header-divider" />
        <span>{viewing ? "NOSSO PEQUENO UNIVERSO" : "LEMBRANÇAS QUE CONECTAM"}</span>
        <Sparkles size={15} strokeWidth={1.4} aria-hidden="true" />
      </div>
    </header>
  );
}

function PhotoPage({ memory }: { memory: Memory }) {
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const valid = isValidPhotoUrl(memory.imageUrl);

  return (
    <div className="site photo-site">
      <Header viewing />
      <main className="photo-main page-shell">
        <div className="photo-intro">
          <div className="eyebrow"><span className="eyebrow-line" /> FEITO PARA GUARDAR <span className="eyebrow-line" /></div>
          <span className="mini-heart" aria-hidden="true">♥</span>
          <h1>{memory.title || DEFAULT_MEMORY.title}<span className="title-dot">.</span></h1>
          <p>{memory.message || "Uma imagem, um momento e uma história só nossa."}</p>
        </div>
        <div className="photo-display-wrap">
          <span className="star-detail star-detail-left" aria-hidden="true">✳</span>
          <section className="photo-frame" aria-label="Nossa foto">
            {valid && !failed ? (
              <img
                key={retryCount}
                className="shared-photo"
                src={memory.imageUrl}
                alt={memory.title || "Uma lembrança especial"}
                onError={() => setFailed(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="photo-unavailable" role="status">
                <ImageOff size={42} strokeWidth={1.3} aria-hidden="true" />
                <h2>Não foi possível abrir a foto.</h2>
                <p>O endereço pode ter expirado ou a imagem pode não estar pública. Peça um novo QR Code a quem compartilhou.</p>
                {valid && (
                  <button type="button" className="text-button" onClick={() => { setFailed(false); setRetryCount((count) => count + 1); }}>
                    <RefreshCw size={16} aria-hidden="true" /> Tentar novamente
                  </button>
                )}
              </div>
            )}
            <div className="frame-bottom"><Heart size={15} fill="currentColor" strokeWidth={1.6} aria-hidden="true" /> PARA SEMPRE, AQUI.</div>
          </section>
          <span className="star-detail star-detail-right" aria-hidden="true">✳</span>
        </div>
        <div className="photo-note">um pedacinho da nossa história <span aria-hidden="true">✶</span></div>
        <div className="photo-actions">
          <a href={window.location.pathname} className="back-link"><ArrowLeft size={17} /> Voltar ao início</a>
          {valid && !failed && <a className="back-link" href={memory.imageUrl} target="_blank" rel="noreferrer noopener">Abrir foto original <ExternalLink size={15} /></a>}
        </div>
      </main>
      <footer className="site-footer page-shell"><span>entre nós, com carinho.</span><span>♥</span></footer>
    </div>
  );
}

function App() {
  const viewingMemory = useMemo(getPhotoMemory, []);
  const [draft, setDraft] = useState<Memory>(readSavedMemory);
  const [published, setPublished] = useState<Memory | null>(() => {
    const saved = readSavedMemory();
    return isValidPhotoUrl(saved.imageUrl) ? saved : null;
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const shareUrl = useMemo(() => published ? createShareUrl(published) : "", [published]);

  useEffect(() => {
    setThumbnailFailed(false);
  }, [published?.imageUrl]);

  if (viewingMemory) return <PhotoPage memory={viewingMemory} />;

  function generateQR(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const next = {
      imageUrl: draft.imageUrl.trim(),
      title: draft.title.trim() || DEFAULT_MEMORY.title,
      message: draft.message.trim(),
    };
    if (!isValidPhotoUrl(next.imageUrl)) {
      setError("Insira um link público de imagem que comece com https:// e não exija login.");
      return;
    }
    const url = createShareUrl(next);
    if (url.length > 1100) {
      setError("O link ficou grande demais para um QR Code fácil de escanear. Use um endereço de imagem mais curto.");
      return;
    }
    setPublished(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // O QR Code funciona mesmo se o navegador bloquear o armazenamento local.
    }
    setNotice("Tudo pronto! Seu QR Code já pode ser compartilhado.");
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice("Link copiado! Agora é só compartilhar.");
    } catch {
      setNotice("Selecione e copie o link no campo logo abaixo.");
    }
  }

  function downloadQr() {
    const canvas = qrRef.current;
    if (!canvas) {
      setNotice("Gere um QR Code antes de baixar.");
      return;
    }
    try {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "entre-nos-qr-code.png";
      document.body.append(link);
      link.click();
      link.remove();
      setNotice("QR Code preparado para download.");
    } catch {
      setNotice("Não foi possível baixar a imagem. Tente novamente.");
    }
  }

  return (
    <div className="site">
      <Header />
      <main>
        <section className="hero page-shell" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> UMA SURPRESA ESPECIAL</div>
            <h1 id="hero-title">Um código.<br />Uma foto.<br /><em>Mil memórias.</em></h1>
            <p className="hero-description">Transforme uma foto especial em uma surpresa. Compartilhe o QR Code e deixe a pessoa descobrir a lembrança ao escanear com a câmera do celular.</p>
            <div className="hero-stamp"><span className="stamp-heart">♥</span><span>FEITO COM<br /><strong>CARINHO</strong></span><ArrowDownRight size={29} strokeWidth={1.3} aria-hidden="true" /></div>
            <div className="steps" aria-label="Como funciona">
              <div className="step"><span className="step-number">01</span><div><strong>Escolha a foto</strong><span>Cole o link público da imagem.</span></div></div>
              <div className="step"><span className="step-number">02</span><div><strong>Gere o QR Code</strong><span>Baixe ou compartilhe o código.</span></div></div>
              <div className="step"><span className="step-number">03</span><div><strong>Revele a surpresa</strong><span>Ao escanear, a foto aparece.</span></div></div>
            </div>
          </div>
          <div className="qr-column">
            <div className="qr-topline"><span>SEU CONVITE DIGITAL</span><span className="tiny-asterisk" aria-hidden="true">✳</span></div>
            <div className="qr-card" aria-label="Área de geração do QR Code">
              <div className="qr-card-header"><span className="tag-small"><span className="tag-dot" /> EXPERIÊNCIA PERSONALIZADA</span><Heart size={19} strokeWidth={1.25} aria-hidden="true" /></div>
              <h2>Tem uma surpresa<br /><em>esperando por você.</em></h2>
              <p className="qr-card-description">Aponte a câmera do celular e descubra o que guardamos aqui.</p>
              <div className={"qr-paper" + (published ? " qr-paper-ready" : "")}>
                {published ? (
                  <QRCodeCanvas
                    ref={qrRef}
                    value={shareUrl}
                    size={260}
                    includeMargin
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#203d36"
                    title="QR Code para abrir a foto"
                    aria-label="QR Code para acessar a foto compartilhada"
                  />
                ) : (
                  <div className="qr-empty">
                    <QrCode size={67} strokeWidth={1.1} aria-hidden="true" />
                    <span>SEU QR CODE APARECERÁ AQUI</span>
                  </div>
                )}
              </div>
              <div className="qr-card-footer"><ScanLine size={20} strokeWidth={1.5} aria-hidden="true" /><span>{published ? "Pronto para escanear" : "Configure sua foto abaixo"}</span><span className="qr-card-sun" aria-hidden="true">✳</span></div>
            </div>
            <div className="qr-underneath">
              <span><Camera size={16} aria-hidden="true" /> Funciona com a câmera do celular</span>
              <span>01 / 01</span>
            </div>
          </div>
        </section>

        <section className="customize-section" id="personalizar" aria-labelledby="customize-title">
          <div className="page-shell customize-layout">
            <div className="customize-copy">
              <span className="section-kicker">O TOQUE FINAL</span>
              <h2 id="customize-title">Faça essa lembrança <em>ser ainda mais sua.</em></h2>
              <p>Escolha uma foto e escreva algumas palavras. Nós transformamos tudo em um link especial, prontinho para virar QR Code.</p>
              <div className="privacy-note"><Link2 size={20} strokeWidth={1.6} aria-hidden="true" /><span>A foto precisa ter um link HTTPS público e direto. Qualquer pessoa com o QR Code poderá vê-la.</span></div>
            </div>
            <div className="form-panel">
              <form onSubmit={generateQR} noValidate>
                <div className="form-title"><div><span className="form-index">01 — PERSONALIZE</span><h3>Sua lembrança</h3></div><ImagePlus size={24} strokeWidth={1.25} aria-hidden="true" /></div>
                <div className="field">
                  <label htmlFor="imageUrl">Link público da foto <span>*</span></label>
                  <div className="field-input-wrap"><Link2 size={18} aria-hidden="true" /><input id="imageUrl" name="imageUrl" type="url" inputMode="url" autoComplete="url" required maxLength={500} placeholder="https://exemplo.com/nossa-foto.jpg" value={draft.imageUrl} onChange={(event) => { setDraft({ ...draft, imageUrl: event.target.value }); setError(""); }} aria-describedby="image-hint form-error" aria-invalid={Boolean(error)} /></div>
                  <p className="field-hint" id="image-hint">Use o endereço direto de uma imagem disponível sem login.</p>
                </div>
                <div className="field">
                  <label htmlFor="title">Título da surpresa</label>
                  <input id="title" name="title" type="text" maxLength={48} placeholder="Uma lembrança nossa" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="message">Uma mensagem especial</label>
                  <textarea id="message" name="message" rows={3} maxLength={120} placeholder="Escreva algumas palavras..." value={draft.message} onChange={(event) => setDraft({ ...draft, message: event.target.value })} />
                  <span className="character-count">{draft.message.length}/120</span>
                </div>
                {error && <p className="form-error" id="form-error" role="alert">{error}</p>}
                <button className="generate-button" type="submit">Gerar meu QR Code <ArrowUpRight size={19} aria-hidden="true" /></button>
              </form>
              {published && (
                <div className="share-panel" aria-labelledby="share-title">
                  <div className="share-divider" />
                  <div className="share-heading"><div><span className="form-index">02 — COMPARTILHE</span><h3 id="share-title">Tudo pronto!</h3></div><Check size={21} strokeWidth={2} aria-hidden="true" /></div>
                  <div className="share-actions">
                    <button type="button" className="download-button" onClick={downloadQr}><Download size={18} aria-hidden="true" /> Baixar QR Code</button>
                    <button type="button" className="copy-button" onClick={copyLink}><Copy size={18} aria-hidden="true" /> Copiar link</button>
                  </div>
                  <label htmlFor="shareUrl" className="share-label">LINK PARA COMPARTILHAR</label>
                  <input id="shareUrl" className="share-url" readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} aria-label="Link da sua foto para compartilhar" />
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="preview-link">Visualizar como a pessoa vai ver <ExternalLink size={15} aria-hidden="true" /></a>
                  {!thumbnailFailed && <img className="validation-thumbnail" src={published.imageUrl} alt="" onError={() => setThumbnailFailed(true)} />}
                  {thumbnailFailed && <p className="thumbnail-warning" role="status">A imagem não carregou nesta prévia. Verifique se o link é direto e público antes de compartilhar.</p>}
                </div>
              )}
              {notice && <p className="notice" role="status"><Check size={16} aria-hidden="true" /> {notice}</p>}
            </div>
          </div>
        </section>
        <section className="closing-section page-shell"><div className="closing-line" /><div className="closing-inner"><span aria-hidden="true">✳</span><p>Porque as melhores coisas da vida<br /><em>merecem ser compartilhadas.</em></p><span aria-hidden="true">✳</span></div></section>
      </main>
      <footer className="site-footer page-shell"><span>entre nós, com carinho.</span><span>2026 · FEITO PARA SENTIR <Heart size={12} fill="currentColor" aria-hidden="true" /></span></footer>
    </div>
  );
}

export default App;
