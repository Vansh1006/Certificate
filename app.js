const AMOY_CHAIN_ID_DECIMAL = 80002;
const AMOY_EXPLORER = "https://amoy.polygonscan.com";
let ipfsGateway = "https://gateway.pinata.cloud/ipfs";
let backendStorageEnabled = false;
let defaultContractAddress = "";
let publicAppUrl = "https://ndisc-blockchain-infrastructure.onrender.com";

let lastIssuedCertificate = null;

const issueForm = document.querySelector("#issueForm");
const txVerifyForm = document.querySelector("#txVerifyForm");
const manualVerifyForm = document.querySelector("#manualVerifyForm");
const issueResult = document.querySelector("#issueResult");
const verifyResult = document.querySelector("#verifyResult");
const downloadPdfBtn = document.querySelector("#downloadPdfBtn");
const uploadPdfBtn = document.querySelector("#uploadPdfBtn");
const contractAddressInput = document.querySelector("#contractAddressInput");
const storageStatus = document.querySelector("#storageStatus");
const qrCertificatePreview = document.querySelector("#qrCertificatePreview");
const crimeGlossary = document.querySelector("#crimeGlossary");
const glossarySearch = document.querySelector("#glossarySearch");
const alphabetFilter = document.querySelector("#alphabetFilter");
const glossaryGrid = document.querySelector("#glossaryGrid");
const glossarySummary = document.querySelector("#glossarySummary");

const glossaryItems = [
  {
    name: "Airdrop Scam",
    meaning: "A fake token giveaway that tricks people into connecting a wallet, signing a malicious approval, or sharing sensitive information.",
    howItWorks: "Scammers promote a free airdrop on social media, messaging apps, or lookalike websites. The victim is asked to connect a wallet or claim tokens. The claim button may request a dangerous signature that gives the attacker permission to move tokens or NFTs from the wallet.",
    warningSigns: "Unexpected free-token messages, urgent countdown timers, websites with misspelled domains, requests to approve unlimited spending, and claims that require a seed phrase or private key.",
    protection: "Verify airdrops only through the official project website and official social channels. Use a separate low-value wallet for experiments, review token approvals before signing, and never enter a seed phrase to claim any reward.",
    severity: "High",
    tags: ["Fraud", "Wallet Theft", "Social Engineering"],
  },
  {
    name: "Bitcoin ATM Money Laundering",
    meaning: "The use of Bitcoin ATMs to move criminal funds or pressure victims into sending crypto to criminals.",
    howItWorks: "Criminals may instruct victims to withdraw cash, visit a crypto ATM, and send Bitcoin to a provided address. In laundering cases, cash from illegal activity is converted into cryptocurrency through repeated ATM transactions to make tracing harder.",
    warningSigns: "Someone asks you to use a crypto ATM to pay taxes, fines, delivery fees, job deposits, or investment charges. They may stay on the phone, give step-by-step instructions, and pressure you to keep the transaction secret.",
    protection: "No government agency, bank, or legitimate company asks for payment through a Bitcoin ATM. Stop the transaction if you feel pressured, contact the organization through official channels, and report suspicious ATM instructions to local authorities.",
    severity: "High",
    tags: ["Fraud", "Money Laundering", "Social Engineering"],
  },
  {
    name: "Cryptojacking",
    meaning: "Unauthorized use of a device or cloud server to mine cryptocurrency.",
    howItWorks: "Attackers infect computers, websites, browser extensions, or cloud accounts with mining scripts. The victim may not lose wallet funds directly, but the attacker steals computing power, increases electricity usage, slows systems, and may create large cloud bills.",
    warningSigns: "Devices become unusually slow or hot, fans run constantly, cloud bills spike, CPU usage remains high, or security tools detect unknown mining processes.",
    protection: "Keep systems patched, avoid untrusted browser extensions, use endpoint protection, monitor cloud usage, restrict admin access, and set billing alerts for cloud accounts.",
    severity: "Medium",
    tags: ["Malware", "Cloud Abuse"],
  },
  {
    name: "Customer Support Impersonation",
    meaning: "A scam where criminals pretend to be support staff from an exchange, wallet, or crypto project.",
    howItWorks: "Attackers reply to public complaints or send direct messages claiming they can solve a wallet or exchange issue. They may ask the victim to share recovery phrases, install remote access software, or connect to a fake support portal.",
    warningSigns: "Support contacts you first through direct message, asks for your seed phrase, asks to screen-share your wallet, or sends a link that is not from the official domain.",
    protection: "Use only official support portals from the company's verified website. Never share recovery phrases, never install remote access tools for wallet support, and treat unsolicited support messages as suspicious.",
    severity: "High",
    tags: ["Fraud", "Social Engineering", "Wallet Theft"],
  },
  {
    name: "DeFi Exploit",
    meaning: "An attack that abuses a weakness in a decentralized finance protocol, smart contract, bridge, oracle, or governance process.",
    howItWorks: "Attackers may manipulate price oracles, use flash loans, exploit smart contract bugs, drain liquidity pools, or abuse permissions. Users can lose funds even without being individually targeted if the protocol itself is compromised.",
    warningSigns: "Unaudited contracts, anonymous teams, unusually high yields, paused withdrawals, emergency governance changes, or sudden abnormal token price movement.",
    protection: "Use audited and established protocols, spread risk across platforms, avoid depositing funds you cannot afford to lose, monitor protocol announcements, and understand that high yield usually comes with high technical risk.",
    severity: "High",
    tags: ["DeFi", "Smart Contract", "Fraud"],
  },
  {
    name: "Digital Asset Theft",
    meaning: "The stealing of cryptocurrency, NFTs, tokens, private keys, or wallet access.",
    howItWorks: "Theft can happen through phishing, malware, leaked seed phrases, SIM swapping, malicious approvals, exchange account compromise, or insecure custody practices. Once crypto is transferred, recovery is difficult because blockchain transactions are usually irreversible.",
    warningSigns: "Unknown wallet transactions, unexpected approval requests, login alerts from exchanges, changed withdrawal addresses, or missing NFTs and tokens.",
    protection: "Use hardware wallets for important assets, enable strong two-factor authentication on exchanges, keep seed phrases offline, regularly revoke unnecessary approvals, and separate daily-use wallets from savings wallets.",
    severity: "High",
    tags: ["Wallet Theft", "Malware", "Fraud"],
  },
  {
    name: "Duplicate NFT Fraud",
    meaning: "A scam where copies of an NFT or collection are sold as if they are original or officially authorized.",
    howItWorks: "Fraudsters copy artwork, collection names, logos, descriptions, and metadata, then list fake NFTs on marketplaces. Buyers may think they are purchasing from the real creator or collection.",
    warningSigns: "Collection names with tiny spelling differences, low trading history, suspiciously cheap prices, unverified contracts, and creators with no official links.",
    protection: "Buy through verified collection pages, check the contract address from the official creator site, review marketplace verification, and avoid rushing into deals that look too cheap.",
    severity: "Medium",
    tags: ["NFT", "Fraud"],
  },
  {
    name: "Fake Crypto Exchange",
    meaning: "A fraudulent trading platform built to steal deposits, identity documents, or login credentials.",
    howItWorks: "The fake exchange may show realistic dashboards, fake profits, and fake support staff. Victims deposit crypto, but withdrawals are blocked until they pay invented taxes, fees, or verification charges.",
    warningSigns: "Guaranteed returns, unknown exchange names, no regulatory or company details, withdrawal fees that keep increasing, and support staff pushing you to deposit more.",
    protection: "Use reputable exchanges, type URLs manually, research company registration and reviews, test withdrawals with small amounts, and never pay extra fees to unlock suspicious profits.",
    severity: "High",
    tags: ["Fraud", "Investment", "Wallet Theft"],
  },
  {
    name: "Fake Wallet Application",
    meaning: "A malicious wallet app or browser extension designed to steal seed phrases or redirect transactions.",
    howItWorks: "Attackers upload fake apps to app stores, advertise them in search results, or share links in communities. The app may ask users to import a seed phrase, then immediately send it to the attacker.",
    warningSigns: "Recently published apps, low review quality, developer names that do not match the official wallet, requests for seed phrases outside normal recovery flow, and links from ads or direct messages.",
    protection: "Download wallets only from official websites or verified app store publisher pages. Bookmark official wallet sites, check developer names carefully, and never install wallet apps from random links.",
    severity: "High",
    tags: ["Wallet Theft", "Malware", "Social Engineering"],
  },
  {
    name: "Giveaway Scam",
    meaning: "A fake promotion that promises to multiply or return cryptocurrency after the victim sends funds first.",
    howItWorks: "Scammers impersonate celebrities, companies, or crypto founders and announce a limited giveaway. The victim is told to send crypto to receive a larger amount back, but the funds are simply stolen.",
    warningSigns: "Send one coin and get two back, livestreams using deepfake or stolen video, urgent limited-time messages, and wallet addresses posted in comments or fake websites.",
    protection: "Remember that legitimate giveaways do not require sending crypto first. Verify announcements through official websites and never trust wallet addresses from social posts, comments, or livestream overlays.",
    severity: "High",
    tags: ["Fraud", "Social Engineering"],
  },
  {
    name: "ICO Fraud",
    meaning: "A fraudulent initial coin offering that raises money for a token or project that is fake, misleading, or never delivered.",
    howItWorks: "The project may publish a polished whitepaper, fake team profiles, unrealistic roadmaps, and paid promotion. After collecting funds, the team may disappear, delay endlessly, or deliver a worthless token.",
    warningSigns: "Anonymous or unverifiable team, copied whitepaper, guaranteed returns, pressure to buy quickly, no working product, and unclear token utility.",
    protection: "Research the team, product, token economics, legal disclosures, and independent audits. Avoid investing only because influencers promote a sale or because early buyers are promised impossible gains.",
    severity: "High",
    tags: ["Fraud", "Investment"],
  },
  {
    name: "Impersonation Fraud",
    meaning: "A scam where criminals pretend to be a trusted person, brand, employee, influencer, or authority figure.",
    howItWorks: "The attacker creates fake profiles, cloned websites, spoofed emails, or fake phone numbers. They use trust and urgency to convince victims to send crypto, reveal secrets, or install malicious software.",
    warningSigns: "Unexpected requests for crypto, new accounts claiming to be known people, spelling mistakes in domains, urgency, secrecy, or refusal to verify identity through a trusted channel.",
    protection: "Confirm requests through a separate official channel, inspect domains carefully, avoid acting under pressure, and use internal approval processes for business payments.",
    severity: "High",
    tags: ["Fraud", "Social Engineering"],
  },
  {
    name: "Investment Fraud",
    meaning: "A scheme that promises profitable crypto trading, mining, staking, or managed investment returns but is designed to steal money.",
    howItWorks: "Scammers show fake dashboards, fabricated profits, testimonials, and withdrawal screenshots. They may allow one small withdrawal to build trust, then demand larger deposits or fees before disappearing.",
    warningSigns: "Guaranteed profits, risk-free claims, referral pressure, screenshots instead of verifiable proof, and requests for tax or unlock fees before withdrawal.",
    protection: "Be skeptical of guaranteed returns, verify licenses and company identity, avoid sending funds to people met online, and test any platform with small amounts before committing more.",
    severity: "High",
    tags: ["Fraud", "Investment", "Social Engineering"],
  },
  {
    name: "Malware",
    meaning: "Software designed to steal keys, change wallet addresses, spy on activity, or compromise crypto accounts.",
    howItWorks: "Malware may arrive through cracked software, fake wallet apps, attachments, browser extensions, or malicious downloads. Some malware replaces copied wallet addresses with the attacker's address, while others steal browser data or seed phrases.",
    warningSigns: "Clipboard wallet addresses change after copying, unknown browser extensions appear, antivirus alerts trigger, logins happen from unknown devices, or files ask for unnecessary permissions.",
    protection: "Avoid pirated software, keep devices updated, use reputable security tools, verify wallet addresses before sending, and store valuable assets on hardware wallets.",
    severity: "High",
    tags: ["Malware", "Wallet Theft"],
  },
  {
    name: "Market Manipulation",
    meaning: "Artificial activity used to influence crypto prices or mislead traders.",
    howItWorks: "Manipulators may coordinate misleading posts, fake volume, spoof orders, wash trades, or pump campaigns. The goal is often to create false excitement so others buy at inflated prices.",
    warningSigns: "Sudden hype without news, thin liquidity, anonymous promoters, aggressive price targets, unusual trading volume, and communities banning critical questions.",
    protection: "Avoid trading based only on hype, check liquidity and market depth, research fundamentals, use risk limits, and be cautious with tokens that are heavily promoted but lightly traded.",
    severity: "Medium",
    tags: ["Fraud", "Trading"],
  },
  {
    name: "NFT Phishing",
    meaning: "A phishing attack designed to steal NFTs or wallet permissions.",
    howItWorks: "Victims receive fake mint links, marketplace offers, airdrop claims, or verification pages. After connecting a wallet, they are asked to sign a transaction that transfers NFTs or approves the attacker.",
    warningSigns: "Urgent mint windows, fake collection links, unsolicited offers, requests for broad approvals, and signing prompts that do not clearly match the action you expected.",
    protection: "Use official links, review every wallet signature, keep valuable NFTs in a cold wallet, revoke unnecessary approvals, and use a separate minting wallet for new projects.",
    severity: "High",
    tags: ["NFT", "Phishing", "Wallet Theft"],
  },
  {
    name: "NFT Rug Pull",
    meaning: "An NFT project that raises money and then abandons promised development, utility, or community support.",
    howItWorks: "The team sells NFTs with promises of games, memberships, rewards, or metaverse access. After minting out, they stop communicating, drain funds, or deliver little to nothing.",
    warningSigns: "Anonymous team, unrealistic roadmap, excessive hype, no product proof, suspicious wallet movements, and closed or heavily moderated community channels.",
    protection: "Check the team's history, treasury transparency, roadmap realism, contract details, and community behavior. Treat NFT purchases as high-risk unless there is clear evidence of delivery.",
    severity: "High",
    tags: ["NFT", "Fraud", "Rug Pull"],
  },
  {
    name: "NFT Swap Scam",
    meaning: "A trade trick where the victim is pushed into swapping a valuable NFT for a fake, less valuable, or lookalike asset.",
    howItWorks: "The scammer may use marketplace trade tools, private links, or fake escrow pages. They may switch the asset at the last moment or rely on the victim not checking collection verification and token details.",
    warningSigns: "Pressure to trade quickly, private marketplace links, similar-looking NFTs, changed trade terms, and reluctance to use verified marketplace tools.",
    protection: "Inspect collection verification, contract address, token ID, and trade details before approving. Avoid rushed private trades and use reputable platforms with clear asset previews.",
    severity: "Medium",
    tags: ["NFT", "Fraud", "Social Engineering"],
  },
  {
    name: "Phishing",
    meaning: "A deceptive message or website that steals passwords, seed phrases, private keys, or wallet approvals.",
    howItWorks: "Attackers send fake emails, ads, search results, messages, or websites that look like trusted crypto services. Victims enter credentials or sign harmful wallet transactions.",
    warningSigns: "Misspelled domains, urgent security alerts, unexpected login links, seed phrase requests, and wallet popups asking for permissions unrelated to the page.",
    protection: "Bookmark important crypto sites, use password managers to detect fake domains, enable two-factor authentication, and never type a seed phrase into a website.",
    severity: "High",
    tags: ["Phishing", "Social Engineering", "Wallet Theft"],
  },
  {
    name: "Ponzi Scheme",
    meaning: "A fake investment program that pays older participants using money from new participants instead of real profits.",
    howItWorks: "The scheme promises consistent returns and rewards recruitment. Early users may receive payouts to build credibility, but the system collapses when new deposits slow down.",
    warningSigns: "Guaranteed daily returns, referral bonuses, secret trading strategies, no clear business model, and pressure to reinvest instead of withdraw.",
    protection: "Ask how returns are generated, verify independent audits and licenses, avoid recruitment-based returns, and be suspicious of platforms that make withdrawing difficult.",
    severity: "High",
    tags: ["Fraud", "Investment"],
  },
  {
    name: "Pump and Dump",
    meaning: "A coordinated campaign to inflate a token price and then sell to late buyers.",
    howItWorks: "Organizers quietly buy a low-liquidity token, promote it aggressively, and encourage others to buy. Once the price rises, insiders sell, causing the price to collapse.",
    warningSigns: "Sudden group messages telling everyone to buy at the same time, unrealistic price targets, tiny market cap, low liquidity, and anonymous organizers.",
    protection: "Avoid coordinated trading groups, check liquidity, do not chase sudden green candles, and understand that late buyers usually carry the losses.",
    severity: "High",
    tags: ["Fraud", "Trading", "Market Manipulation"],
  },
  {
    name: "Quishing",
    meaning: "Phishing through QR codes that send victims to malicious crypto websites or payment addresses.",
    howItWorks: "Attackers place QR codes in emails, posters, invoices, or fake support pages. Scanning the code may open a phishing page, wallet drainer, or payment request.",
    warningSigns: "QR codes from unknown sources, codes pasted over official signs, shortened links after scanning, and wallet requests that appear immediately after opening the page.",
    protection: "Preview QR links before opening, avoid scanning payment QR codes from untrusted sources, verify official domains, and do not connect wallets to pages opened from random QR codes.",
    severity: "Medium",
    tags: ["Phishing", "Social Engineering"],
  },
  {
    name: "Romance Crypto Fraud",
    meaning: "A relationship-based scam where a criminal builds emotional trust and then pushes the victim into crypto payments or fake investments.",
    howItWorks: "The scammer may spend weeks or months building trust through dating apps or social media. They introduce a fake investment opportunity, claim financial emergencies, or guide the victim to a fraudulent exchange.",
    warningSigns: "Online-only relationship, refusal to video call, sudden investment advice, requests for crypto transfers, and pressure to keep the relationship or investment private.",
    protection: "Do not send crypto to someone you have only met online. Verify identities, discuss concerns with trusted people, and be cautious when romance and investment advice appear together.",
    severity: "High",
    tags: ["Fraud", "Investment", "Social Engineering"],
  },
  {
    name: "Rug Pull",
    meaning: "A scam where project insiders raise funds or attract liquidity and then abandon the project or drain funds.",
    howItWorks: "Developers launch a token, promote it heavily, and encourage buyers or liquidity providers. They may then remove liquidity, mint more tokens, disable selling, or disappear.",
    warningSigns: "Anonymous team, unaudited code, locked selling, concentrated token ownership, no locked liquidity, and promises of guaranteed returns.",
    protection: "Check token contracts, liquidity locks, holder distribution, audits, and team credibility. Avoid tokens where the team can easily mint, blacklist, or block selling.",
    severity: "High",
    tags: ["Fraud", "DeFi", "Rug Pull"],
  },
  {
    name: "Sextortion",
    meaning: "A threat-based scam where criminals demand crypto by claiming they have private or embarrassing material.",
    howItWorks: "Attackers send emails or messages claiming they hacked the victim's device or recorded private activity. They demand cryptocurrency to avoid releasing the material, often using leaked old passwords to sound convincing.",
    warningSigns: "Generic threats, old passwords included in emails, strict payment deadlines, cryptocurrency wallet addresses, and no real proof beyond intimidation.",
    protection: "Do not pay. Change exposed passwords, enable two-factor authentication, scan devices, preserve the message as evidence, and report the threat to the appropriate cybercrime authority.",
    severity: "Medium",
    tags: ["Fraud", "Extortion", "Social Engineering"],
  },
  {
    name: "Sleep-Minting Fraud",
    meaning: "A deceptive NFT technique that makes it appear as if a well-known creator minted an NFT when they did not authorize it.",
    howItWorks: "A malicious actor manipulates NFT contract behavior or metadata history so a token appears connected to a famous wallet or creator. Buyers may trust the false origin and pay a premium.",
    warningSigns: "Unusual transfer history, unofficial marketplace pages, creator denial, contract addresses not listed by the creator, and provenance that looks too convenient.",
    protection: "Confirm NFTs through the creator's official links, inspect contract addresses and transfer history, and avoid relying only on displayed creator names in marketplaces.",
    severity: "Medium",
    tags: ["NFT", "Fraud"],
  },
  {
    name: "Smishing",
    meaning: "Phishing delivered through SMS or messaging apps.",
    howItWorks: "Victims receive texts claiming there is a wallet issue, exchange login, failed delivery, tax warning, or prize. The link leads to a fake page that steals credentials, seed phrases, or payment information.",
    warningSigns: "Unexpected texts with links, urgent account warnings, shortened URLs, spelling mistakes, and messages that ask for wallet recovery phrases or one-time codes.",
    protection: "Do not open suspicious SMS links. Visit exchanges and wallets through bookmarks or official apps, never share one-time codes, and report phishing messages to the platform or telecom provider.",
    severity: "High",
    tags: ["Phishing", "Social Engineering"],
  },
  {
    name: "Social Engineering",
    meaning: "Manipulation that tricks people into taking unsafe actions, such as sending crypto, sharing secrets, or signing dangerous transactions.",
    howItWorks: "Attackers use trust, fear, urgency, authority, curiosity, or greed. They may pretend to be friends, staff, recruiters, law enforcement, investors, or technical support.",
    warningSigns: "Pressure to act fast, secrecy, emotional manipulation, requests to bypass normal process, and instructions that involve crypto payments or wallet access.",
    protection: "Slow down, verify identity through separate channels, use approval workflows, educate staff and family, and never let urgency override basic security checks.",
    severity: "High",
    tags: ["Social Engineering", "Fraud"],
  },
  {
    name: "Socially Engineered Investment Fraud",
    meaning: "An investment scam where criminals use personal trust, coaching, and emotional pressure to guide victims into fake crypto platforms.",
    howItWorks: "The scammer builds a relationship, introduces a mentor or trading platform, and teaches the victim how to deposit crypto. Fake dashboards show profits, but withdrawals are blocked by invented fees or taxes.",
    warningSigns: "A new online contact gives investment advice, profits look too steady, withdrawals require more deposits, and the platform is not independently reputable.",
    protection: "Avoid investment advice from online strangers, verify platforms independently, never pay extra to unlock withdrawals, and talk to trusted people before sending large amounts.",
    severity: "High",
    tags: ["Fraud", "Investment", "Social Engineering"],
  },
  {
    name: "Spoofing",
    meaning: "Faking an identity, website, email address, phone number, token, or order book activity to mislead victims.",
    howItWorks: "Attackers may spoof domains, caller IDs, email senders, wallet labels, or trading orders. The goal is to make a fake source look trusted or create a false market signal.",
    warningSigns: "Sender addresses that almost match official ones, lookalike domains, caller ID that cannot be verified, or order book activity that disappears before execution.",
    protection: "Verify contact details independently, check full domain names, use anti-phishing codes where available, and avoid relying on caller ID or display names as proof.",
    severity: "Medium",
    tags: ["Fraud", "Social Engineering", "Trading"],
  },
  {
    name: "Wash Trading",
    meaning: "Fake trading activity where the same party buys and sells assets to create artificial volume or price signals.",
    howItWorks: "A trader or group repeatedly trades with themselves across wallets or accounts. This can make tokens or NFTs appear more popular and liquid than they really are.",
    warningSigns: "High volume with few real holders, repeated trades between related wallets, sudden marketplace ranking jumps, and prices that do not match organic demand.",
    protection: "Check holder distribution, transaction history, unique buyers, liquidity quality, and independent market data before relying on volume or floor price as proof of demand.",
    severity: "Medium",
    tags: ["NFT", "Trading", "Market Manipulation"],
  },
];

let activeGlossaryLetter = "A";

issueForm?.addEventListener("submit", issueCertificate);
txVerifyForm?.addEventListener("submit", verifyByTransactionHash);
manualVerifyForm?.addEventListener("submit", verifyByManualDetails);
glossarySearch?.addEventListener("input", renderGlossary);

downloadPdfBtn?.addEventListener("click", async () => {
  if (!lastIssuedCertificate) return;
  try {
    const blob = await createCertificatePdfBlob(lastIssuedCertificate);
    saveBlob(blob, certificateFileName(lastIssuedCertificate));
  } catch (error) {
    setResult(issueResult, readableError(error), true);
  }
});

uploadPdfBtn?.addEventListener("click", async () => {
  if (!lastIssuedCertificate) return;
  await uploadLastCertificatePdf();
});

init();

async function init() {
  await loadBackendConfig();
  applyPageMode();
  initGlossary();
  prefillFromQr();
}

async function loadBackendConfig() {
  try {
    const response = await fetch("/api/config");
    if (!response.ok) throw new Error("Backend config unavailable");
    const config = await response.json();
    defaultContractAddress = config.contractAddress || "";
    ipfsGateway = config.ipfsGateway || ipfsGateway;
    publicAppUrl = config.publicAppUrl || publicAppUrl;
    backendStorageEnabled = Boolean(config.storageEnabled);
    if (contractAddressInput) contractAddressInput.value = defaultContractAddress;
    if (storageStatus) storageStatus.textContent = backendStorageEnabled
      ? "Cloud PDF storage enabled on backend"
      : "Cloud storage needs Pinata JWT or API secret in backend .env";
  } catch {
    if (storageStatus) storageStatus.textContent = "Backend config unavailable. Start with npm run dev.";
  }
}

function applyPageMode() {
  const mode = currentPageMode();
  const homeActions = document.querySelector("#homeActions");
  if (mode === "home") {
    homeActions?.classList.add("active");
  } else {
    homeActions?.remove();
    crimeGlossary?.remove();
  }
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
  if (mode !== "home") document.querySelector(`#${mode}Panel`)?.classList.add("active");
  document.body.dataset.pageMode = mode;
}

function initGlossary() {
  if (!crimeGlossary || !alphabetFilter || !glossaryGrid) return;

  const availableLetters = new Set(glossaryItems.map((item) => item.name[0].toUpperCase()));
  alphabetFilter.innerHTML = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    .split("")
    .map((letter) => {
      const disabled = availableLetters.has(letter) ? "" : " disabled";
      const pressed = letter === activeGlossaryLetter ? "true" : "false";
      return `<button type="button" class="letter-button" data-letter="${letter}" aria-pressed="${pressed}"${disabled}>${letter}</button>`;
    })
    .join("");

  alphabetFilter.addEventListener("click", (event) => {
    const button = event.target.closest("[data-letter]");
    if (!button || button.disabled) return;
    activeGlossaryLetter = button.dataset.letter;
    if (glossarySearch) glossarySearch.value = "";
    renderGlossary();
  });

  renderGlossary();
}

function renderGlossary() {
  if (!glossaryGrid) return;

  const query = clean(glossarySearch?.value || "").toLowerCase();
  const visibleItems = glossaryItems
    .filter((item) => {
      if (!query) return item.name.toUpperCase().startsWith(activeGlossaryLetter);
      return glossarySearchText(item).includes(query);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  alphabetFilter?.querySelectorAll("[data-letter]").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.letter === activeGlossaryLetter && !query ? "true" : "false");
  });

  if (glossarySummary) {
    glossarySummary.textContent = query
      ? `${visibleItems.length} result${visibleItems.length === 1 ? "" : "s"} found for "${glossarySearch.value.trim()}".`
      : `${visibleItems.length} crypto crime${visibleItems.length === 1 ? "" : "s"} starting with ${activeGlossaryLetter}.`;
  }

  glossaryGrid.innerHTML = visibleItems.length
    ? visibleItems.map(glossaryCardTemplate).join("")
    : `<div class="glossary-empty">No glossary entries matched your search. Try a crime name, tag, warning sign, or prevention keyword.</div>`;

  glossaryGrid.querySelectorAll(".glossary-card-toggle").forEach((button) => {
    button.addEventListener("click", () => toggleGlossaryCard(button));
  });
  glossaryGrid.querySelectorAll(".glossary-card").forEach((card) => {
    card.addEventListener("pointermove", updateGlossaryCardSpotlight);
  });
}

function glossaryCardTemplate(item) {
  const id = `crime-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return `
    <article class="glossary-card">
      <button class="glossary-card-toggle" type="button" aria-expanded="false" aria-controls="${id}">
        <span>
          <small>${escapeHtml(item.tags[0])}</small>
          <strong>${escapeHtml(item.name)}</strong>
        </span>
        <b class="severity severity-${item.severity.toLowerCase()}">${escapeHtml(item.severity)}</b>
      </button>
      <div class="glossary-card-body" id="${id}">
        <div class="glossary-detail">
          <h3>Simple meaning</h3>
          <p>${escapeHtml(item.meaning)}</p>
          <h3>How it works</h3>
          <p>${escapeHtml(item.howItWorks)}</p>
          <h3>Common warning signs</h3>
          <p>${escapeHtml(item.warningSigns)}</p>
          <h3>How to protect yourself</h3>
          <p>${escapeHtml(item.protection)}</p>
          <div class="glossary-tags">
            ${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>
      </div>
    </article>
  `;
}

function toggleGlossaryCard(button) {
  const card = button.closest(".glossary-card");
  const body = card?.querySelector(".glossary-card-body");
  if (!card || !body) return;

  const isOpen = card.classList.toggle("open");
  button.setAttribute("aria-expanded", String(isOpen));
  body.style.maxHeight = isOpen ? `${body.scrollHeight}px` : "0px";
}

function updateGlossaryCardSpotlight(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--spotlight-x", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--spotlight-y", `${event.clientY - rect.top}px`);
}

function glossarySearchText(item) {
  return [
    item.name,
    item.meaning,
    item.howItWorks,
    item.warningSigns,
    item.protection,
    item.severity,
    ...item.tags,
  ].join(" ").toLowerCase();
}

function currentPageMode() {
  if (window.location.pathname.startsWith("/verify")) return "verify";
  if (window.location.pathname.startsWith("/create")) return "create";
  return "home";
}

async function issueCertificate(event) {
  event.preventDefault();
  if (!isContractConfigured()) {
    setResult(issueResult, "N-DISC's official smart contract is not configured on the backend. Add CONTRACT_ADDRESS to the backend environment before issuing certificates.", true);
    return;
  }

  try {
    const details = getFormDetails(issueForm);
    const certificateImages = await getCertificateImages(issueForm);
    setResult(issueResult, "Issuing certificate from approved backend issuer wallet...");
    const issue = await issueCertificateFromBackend(details);

    lastIssuedCertificate = {
      ...details,
      ...certificateImages,
      certificateHash: issue.certificateHash,
      metadataURI: issue.metadataURI,
      pdfURI: "",
      txHash: issue.txHash,
      contractAddress: issue.contractAddress || getContractAddress(),
      chainId: issue.chainId || AMOY_CHAIN_ID_DECIMAL,
      issuedAt: issue.issuedAt,
      issuerWallet: issue.issuerWallet,
    };

    downloadPdfBtn.disabled = false;
    uploadPdfBtn.disabled = false;

    let cloudMessage = "";
    if (backendStorageEnabled) {
      cloudMessage = await uploadLastCertificatePdf({ silent: true });
    }

    setResult(
      issueResult,
      `<strong>Certificate issued successfully.</strong><br />
      Certificate hash: ${issue.certificateHash}<br />
      Transaction: <a href="${AMOY_EXPLORER}/tx/${issue.txHash}" target="_blank" rel="noreferrer">${issue.txHash}</a><br />
      PDF download is ready.${cloudMessage}`
    );
  } catch (error) {
    setResult(issueResult, readableError(error), true);
  }
}

async function issueCertificateFromBackend(details) {
  const response = await fetch("/api/issue-certificate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ details }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Backend issue failed with status ${response.status}`);
  }
  return payload;
}

async function uploadLastCertificatePdf(options = {}) {
  if (!lastIssuedCertificate) return "";

  if (!backendStorageEnabled) {
    const message = "Backend cloud storage is not enabled. Add PINATA_JWT or PINATA_API_KEY plus PINATA_SECRET_API_KEY to .env.";
    if (!options.silent) setResult(issueResult, message, true);
    return `<br />${escapeHtml(message)}`;
  }

  try {
    setResult(issueResult, "Generating PDF and uploading it to IPFS...");

    const blob = await createCertificatePdfBlob(lastIssuedCertificate);
    const fileName = certificateFileName(lastIssuedCertificate);
    const upload = await uploadPdfToBackend(blob, fileName, lastIssuedCertificate);
    const ipfsURI = upload.ipfsURI;
    lastIssuedCertificate.metadataURI = ipfsURI;
    lastIssuedCertificate.pdfURI = ipfsURI;

    const gatewayURL = ipfsToGatewayUrl(ipfsURI);
    const message = `<br />Cloud PDF: <a href="${gatewayURL}" target="_blank" rel="noreferrer">${escapeHtml(ipfsURI)}</a><br />Stored on backend for future verification downloads.`;

    if (!options.silent) {
      setResult(issueResult, `<strong>Upload complete.</strong>${message}`);
    }
    return message;
  } catch (error) {
    const message = `Cloud upload failed: ${readableError(error)}. Local PDF download still works.`;
    if (!options.silent) setResult(issueResult, message, true);
    return `<br />${message}`;
  }
}

async function verifyByTransactionHash(event) {
  event.preventDefault();
  if (!isContractConfigured()) {
    setResult(verifyResult, "N-DISC's official smart contract is not configured on the backend. Add CONTRACT_ADDRESS to the backend environment before transaction verification.", true);
    return;
  }

  try {
    const formData = new FormData(txVerifyForm);
    const txHash = String(formData.get("txHash")).trim();
    setResult(verifyResult, "Verifying transaction through backend POST...");
    const payload = await verifyCertificateWithBackend({ txHash });
    renderBackendVerificationResult(payload);
  } catch (error) {
    setResult(verifyResult, readableError(error), true);
  }
}

async function verifyByManualDetails(event) {
  event.preventDefault();
  if (!isContractConfigured()) {
    setResult(verifyResult, "N-DISC's official smart contract is not configured on the backend. Add CONTRACT_ADDRESS to the backend environment before verification.", true);
    return;
  }

  try {
    const details = getFormDetails(manualVerifyForm);
    setResult(verifyResult, "Verifying certificate through backend POST...");
    const payload = await verifyCertificateWithBackend({ details });
    renderBackendVerificationResult(payload);
  } catch (error) {
    setResult(verifyResult, readableError(error), true);
  }
}

async function verifyCertificateWithBackend(body) {
  const response = await fetch("/api/verify-certificate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Backend verification failed with status ${response.status}`);
  }
  return payload;
}

function renderVerificationResult(result, certificateHash, txHash = "") {
  const [valid, revoked, issuer, issuedAt, revokedAt, metadataURI] = result;

  if (!valid) {
    const revokedMessage = revoked
      ? `<strong>Certificate was found but has been revoked.</strong><br />Revoked At: ${new Date(Number(revokedAt) * 1000).toLocaleString()}`
      : `Certificate hash ${certificateHash} was not found on-chain.`;
    setResult(verifyResult, revokedMessage, true);
    return;
  }

  const issuedDate = Number(issuedAt) ? new Date(Number(issuedAt) * 1000).toLocaleString() : "Recorded on-chain";
  const downloadLink = metadataURI && isDownloadableURI(metadataURI)
    ? `<br />Certificate PDF: <a href="${ipfsToGatewayUrl(metadataURI)}" target="_blank" rel="noreferrer">Download stored certificate</a>`
    : "";

  setResult(
    verifyResult,
    `<strong>Certificate verified on Polygon Amoy.</strong><br />
    Certificate Hash: ${certificateHash}<br />
    Issued At: ${issuedDate}<br />
    Issued By: ${issuer}
    ${downloadLink}
    ${txHash ? `<br />Transaction: <a href="${AMOY_EXPLORER}/tx/${txHash}" target="_blank" rel="noreferrer">${txHash}</a>` : ""}`
  );
}

function renderBackendVerificationResult(payload, element = verifyResult) {
  if (!payload.valid) {
    const message = payload.revoked
      ? `<strong>Certificate was found but has been revoked.</strong><br />Revoked At: ${escapeHtml(payload.revokedAt || "")}`
      : `Certificate hash ${escapeHtml(payload.certificateHash || "")} was not found on-chain.`;
    setResult(element, message, true);
    return;
  }

  const certificatePdfUrl = resolveCertificatePdfUrl(payload);
  const downloadLink = certificatePdfUrl
    ? `<div class="verify-actions"><a class="secondary result-action" href="${escapeHtml(certificatePdfUrl)}" target="_blank" rel="noreferrer" download>Download Certificate PDF</a></div>`
    : "";

  setResult(
    element,
    `<strong>Certificate verified by backend POST on Polygon Amoy.</strong><br />
    Certificate Hash: ${escapeHtml(payload.certificateHash)}<br />
    Issued At: ${escapeHtml(payload.issuedAt || "")}<br />
    Issued By: ${escapeHtml(payload.issuer || "")}
    ${downloadLink}
    ${payload.txHash ? `<br />Transaction: <a href="${AMOY_EXPLORER}/tx/${payload.txHash}" target="_blank" rel="noreferrer">${escapeHtml(payload.txHash)}</a>` : ""}`
  );
}

function resolveCertificatePdfUrl(payload) {
  const storedFile = payload.storedFile || {};
  if (storedFile.gatewayURL) return storedFile.gatewayURL;
  if (storedFile.ipfsURI && isDownloadableURI(storedFile.ipfsURI)) {
    return ipfsToGatewayUrl(storedFile.ipfsURI);
  }
  if (payload.metadataURI && isDownloadableURI(payload.metadataURI)) {
    return ipfsToGatewayUrl(payload.metadataURI);
  }
  return "";
}

function getFormDetails(form) {
  const data = new FormData(form);
  return {
    certificateTitle: clean(data.get("certificateTitle")),
    studentName: clean(data.get("studentName")),
    internshipTitle: clean(data.get("internshipTitle")),
    issuerName: clean(data.get("issuerName")),
    certificateId: clean(data.get("certificateId")),
    startDate: clean(data.get("startDate")),
    endDate: clean(data.get("endDate")),
    description: clean(data.get("description")),
  };
}

function clean(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function hashCertificate(details) {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["string", "string", "string", "string", "string", "string", "string", "string"],
      [
        details.certificateTitle,
        details.studentName,
        details.internshipTitle,
        details.issuerName,
        details.certificateId,
        details.startDate,
        details.endDate,
        details.description,
      ]
    )
  );
}

async function createCertificatePdfBlob(certificate) {
  if (!window.jspdf?.jsPDF) {
    throw new Error("PDF library did not load. Check your internet connection and reload the page.");
  }
  if (!window.qrcode) {
    throw new Error("QR library did not load. Check your internet connection and reload the page.");
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const qrUrl = buildVerificationUrl(certificate);
  const qr = qrcode(0, "M");
  qr.addData(qrUrl);
  qr.make();
  const qrDataUrl = qr.createDataURL(5, 1);
  const hasLogo = Boolean(certificate.logoDataUrl);

  pdf.setFillColor(242, 248, 253);
  pdf.rect(0, 0, width, height, "F");
  pdf.setDrawColor(11, 107, 203);
  pdf.setLineWidth(8);
  pdf.rect(28, 28, width - 56, height - 56);
  pdf.setDrawColor(201, 151, 47);
  pdf.setLineWidth(2);
  pdf.rect(46, 46, width - 92, height - 92);

  if (certificate.logoDataUrl) {
    await drawContainedImage(pdf, certificate.logoDataUrl, width / 2 - 45, 58, 90, 52);
  }

  pdf.setFont("times", "bold");
  pdf.setFontSize(26);
  pdf.setTextColor(11, 107, 203);
  pdf.text("N-DISC Blockchain Infrastructure", width / 2, hasLogo ? 128 : 92, { align: "center" });

  pdf.setFontSize(18);
  pdf.setTextColor(96, 112, 134);
  pdf.text(certificate.certificateTitle || "Certificate", width / 2, hasLogo ? 158 : 126, { align: "center" });

  pdf.setFont("times", "normal");
  pdf.setFontSize(16);
  pdf.setTextColor(16, 32, 51);
  pdf.text("This certificate is proudly presented to", width / 2, hasLogo ? 204 : 180, { align: "center" });

  pdf.setFont("times", "bold");
  pdf.setFontSize(36);
  pdf.setTextColor(16, 32, 51);
  pdf.text(certificate.studentName || "Certificate Holder", width / 2, hasLogo ? 248 : 226, { align: "center" });

  pdf.setFont("times", "normal");
  pdf.setFontSize(16);
  pdf.text("for successfully completing", width / 2, hasLogo ? 288 : 268, { align: "center" });

  pdf.setFont("times", "bold");
  pdf.setFontSize(23);
  pdf.setTextColor(11, 107, 203);
  pdf.text(certificate.internshipTitle || "Certificate Title", width / 2, hasLogo ? 324 : 306, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(72, 86, 104);
  const description = pdf.splitTextToSize(certificate.description || "Internship completed successfully.", 520);
  pdf.text(description, width / 2, hasLogo ? 362 : 350, { align: "center" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(16, 32, 51);
  pdf.text(`Duration: ${formatDate(certificate.startDate)} to ${formatDate(certificate.endDate)}`, 90, 400);
  pdf.text(`Issued by: ${certificate.issuerName || "N-DISC"}`, 90, 426);
  pdf.text(`Certificate ID: ${certificate.certificateId || "NDISC-CERT"}`, 90, 452);
  pdf.setFontSize(8.5);
  drawWrappedMetadataLine(pdf, "Block ID", certificate.certificateHash || "Pending", 90, 478, 330);
  drawWrappedMetadataLine(pdf, "Transaction Hash", certificate.txHash || "Pending", 90, 510, 330);

  pdf.addImage(qrDataUrl, "PNG", width - 190, height - 210, 116, 116);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(11, 107, 203);
  pdf.text("Scan to verify on blockchain", width - 132, height - 82, { align: "center" });

  pdf.setDrawColor(16, 32, 51);
  if (certificate.signatureDataUrl) {
    await drawContainedImage(pdf, certificate.signatureDataUrl, width - 360, 436, 130, 46);
  }
  pdf.line(width - 360, 488, width - 230, 488);
  pdf.setTextColor(16, 32, 51);
  pdf.text("Authorized Signature", width - 295, 512, { align: "center" });

  return pdf.output("blob");
}

async function getCertificateImages(form) {
  const logoFile = form.elements.logoFile?.files?.[0];
  const signatureFile = form.elements.signatureFile?.files?.[0];

  return {
    logoDataUrl: logoFile ? await readPngFileAsDataUrl(logoFile, "logo", 420, 240) : "",
    signatureDataUrl: signatureFile ? await readPngFileAsDataUrl(signatureFile, "signature", 620, 220) : "",
  };
}

async function readPngFileAsDataUrl(file, label, maxWidth, maxHeight) {
  if (file.type !== "image/png") {
    throw new Error(`Please upload the ${label} as a PNG file.`);
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error(`The ${label} PNG must be smaller than 8 MB.`);
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Could not read the ${label} PNG file.`));
    reader.readAsDataURL(file);
  });
  return resizePngDataUrl(dataUrl, maxWidth, maxHeight);
}

function imageDimensions(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
    image.onerror = () => reject(new Error("Could not load uploaded PNG image."));
    image.src = dataUrl;
  });
}

async function resizePngDataUrl(dataUrl, maxWidth, maxHeight) {
  const dimensions = await imageDimensions(dataUrl);
  const scale = Math.min(1, maxWidth / dimensions.width, maxHeight / dimensions.height);
  if (scale === 1) return dataUrl;

  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(dimensions.width * scale));
  canvas.height = Math.max(1, Math.round(dimensions.height * scale));
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load uploaded PNG image."));
    image.src = dataUrl;
  });
}

async function drawContainedImage(pdf, dataUrl, x, y, maxWidth, maxHeight) {
  const dimensions = await imageDimensions(dataUrl);
  const scale = Math.min(maxWidth / dimensions.width, maxHeight / dimensions.height);
  const renderedWidth = dimensions.width * scale;
  const renderedHeight = dimensions.height * scale;
  pdf.addImage(
    dataUrl,
    "PNG",
    x + (maxWidth - renderedWidth) / 2,
    y + (maxHeight - renderedHeight) / 2,
    renderedWidth,
    renderedHeight
  );
}

async function uploadPdfToBackend(blob, fileName, certificate) {
  const pdfBase64 = await blobToBase64(blob);
  const response = await fetch("/api/upload-certificate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      pdfBase64,
      txHash: certificate.txHash,
      certificateHash: certificate.certificateHash,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Backend upload failed with status ${response.status}`);
  }

  return response.json();
}

function drawWrappedMetadataLine(pdf, label, value, x, y, maxWidth) {
  const labelText = `${label}:`;
  const labelWidth = pdf.getTextWidth(labelText) + 4;
  const wrappedValue = pdf.splitTextToSize(String(value || "Pending"), maxWidth - labelWidth);

  pdf.text(labelText, x, y);
  pdf.text(wrappedValue, x + labelWidth, y);
}

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function certificateFileName(certificate) {
  const rawName = certificate.txHash || certificate.certificateId || "certificate";
  return `${rawName.replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`;
}

function buildVerificationUrl(certificate) {
  const params = new URLSearchParams({
    verify: "1",
    txHash: certificate.txHash || "",
  });
  return `${publicAppUrl.replace(/\/$/, "")}/verify?${params.toString()}`;
}

function prefillFromQr() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("verify") !== "1") return;

  if (currentPageMode() !== "verify") {
    window.location.replace(`/verify?${params.toString()}`);
    return;
  }

  if (params.get("txHash") && txVerifyForm) txVerifyForm.elements.txHash.value = params.get("txHash");

  if (qrCertificatePreview) {
    qrCertificatePreview.hidden = false;
    qrCertificatePreview.innerHTML = `
    <p class="eyebrow">QR Certificate View</p>
    <h3>Blockchain verification link</h3>
    <p>This QR code carries only the blockchain transaction reference.</p>
    <dl>
      ${params.get("txHash") ? `<dt>Transaction</dt><dd><a href="${AMOY_EXPLORER}/tx/${params.get("txHash")}" target="_blank" rel="noreferrer">${escapeHtml(params.get("txHash"))}</a></dd>` : ""}
    </dl>
  `;
  }
  setResult(verifyResult, "Transaction hash loaded from QR. Verifying through backend POST...");
  verifyQrWithBackend({}, params.get("txHash") || "");
}

async function verifyQrWithBackend(details, txHash) {
  try {
    setResult(verifyResult, "Certificate details loaded from QR. Verifying through backend POST...");
    const payload = await verifyCertificateWithBackend({ details, txHash });
    renderBackendVerificationResult(payload);
  } catch (error) {
    setResult(verifyResult, `QR backend verification failed: ${readableError(error)}`, true);
  }
}

function isDownloadableURI(uri) {
  return uri.startsWith("ipfs://") || uri.startsWith("https://") || uri.startsWith("http://");
}

function ipfsToGatewayUrl(uri) {
  if (uri.startsWith("ipfs://")) return `${ipfsGateway}/${uri.replace("ipfs://", "")}`;
  return uri;
}

function setResult(element, html, isError = false) {
  if (!element) return;
  element.hidden = false;
  element.classList.toggle("error", isError);
  element.innerHTML = html;
}

function readableError(error) {
  const raw = error?.shortMessage || error?.reason || error?.message || "Something went wrong.";
  if (raw.includes("could not coalesce error")) {
    return "Blockchain transaction failed. The backend checks issuer role and duplicate certificates before submitting the transaction; reload the page and try again to see the exact cause.";
  }
  if (raw.includes("AccessControlUnauthorizedAccount")) {
    return "The backend issuer wallet is not approved to issue certificates. Grant ISSUER_ROLE to the backend issuer wallet from the admin/deployer wallet.";
  }
  if (raw.includes("Already issued")) {
    return "This certificate already exists on-chain. Change the certificate ID/details or verify the existing certificate.";
  }
  return escapeHtml(raw);
}

function isContractConfigured() {
  return ethers.isAddress(getContractAddress());
}

function getContractAddress() {
  return contractAddressInput?.value.trim() || defaultContractAddress;
}

function formatDate(dateString) {
  if (!dateString) return "Not specified";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
