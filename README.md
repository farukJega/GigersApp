# GigersApp

**One Marketplace. Every Skill. Secure Payments.**

GigersApp is a decentralized freelance marketplace built on **Arc Testnet** (Chain ID `5042002`). A client locks a USDC reward in an on-chain escrow contract. A freelancer applies, delivers the work milestone by milestone, and the contract pays them when the client approves. Nobody has to trust a middleman with the money.

| | |
| --- | --- |
| Live app | https://gigers-app.vercel.app |
| Escrow contract | [`0xCE11367DEa3E9Dca96dDE85A3b6670566094C5F4`](https://testnet.arcscan.app/address/0xCE11367DEa3E9Dca96dDE85A3b6670566094C5F4) |
| Network | Arc Testnet, Chain ID 5042002 |
| Payment token | USDC (`0x3600000000000000000000000000000000000000`) |
| Explorer | https://testnet.arcscan.app |

## The problem

Freelance platforms hold the money themselves, charge high fees, and can freeze accounts or disputes at will. Clients fear paying for work that never arrives. Freelancers fear delivering work and never being paid.

## The solution

The money never sits with us. The reward is locked in a smart contract before work starts, released only by the rules of that contract, and every deposit and payment can be verified on the block explorer.

## Features

**Marketplace**
- 10 categories, each with its own icon, description and subcategories: Web Development, Graphic Design, Video and Animation, Writing and Translation, AI and Automation, Blockchain and Web3, Marketing and Social Media, Virtual Assistance, Mobile App Development, Data and Research
- Search, category and subcategory filters, minimum and maximum budget, deadline filter, newest, highest budget and soonest deadline sorting, an active-only filter, and load-more pagination
- **Quick Gigs**: a filter for small jobs with a single payment (not a separate payment system)
- Every gig has its own page with description, skills, budget, deadline, client, applicants, escrow status and related gigs

**Escrow and payments**
- Multi-step Create Gig form with validation and a review summary showing the exact USDC deposit
- USDC approval, then the deposit into the escrow contract. A gig is published only if the transaction succeeds, and the ArcScan link is shown
- **Milestone payments**: a project is split into up to 10 milestones, the total always equals the deposit, and each milestone has its own status (Pending, Submitted, Paid, Refunded, Disputed)
- Apply on-chain: no duplicate applications and a client cannot apply to their own gig, both enforced by the contract
- Client accepts one freelancer, the freelancer submits work, the client approves and the contract pays
- Cancel a gig and get the deposit back while it has no accepted freelancer

**Safety nets built into the contract**
- If a client does not respond within **7 days** of a submission, the freelancer can claim the milestone
- If work is not delivered by the deadline plus **3 days**, the client can refund the milestone
- Either party can open a dispute; the arbiter resolves it by paying the freelancer or refunding the client

**People**
- Client dashboard: posted, open, active and completed gigs, applicants, work awaiting review, disputes, total paid out
- Freelancer dashboard: applications and their outcome, active gigs, work to submit, Quick Gigs, earnings, payment history
- Public profiles for clients and freelancers with an avatar, name, title, bio, skills, categories and portfolio links, plus jobs posted, jobs completed, total earned, total deposited and payment history **read from the blockchain**
- Ratings (1 to 5 stars and a comment) that are only possible after a gig is completed, and only between its client and its freelancer

**Experience**
- 9 interface languages: English, Hausa, Yoruba, Igbo, Arabic (right-to-left), Nigerian Pidgin, French, Chinese, Hindi
- Light and dark themes, mobile-first layout, bottom navigation on phones
- Wallet picker with browser wallets (MetaMask, Rabby and others) and WalletConnect

## How trust works

| Data | Where it lives | Why you can trust it |
| --- | --- | --- |
| USDC deposits, milestones, applications, payments, refunds | On-chain (`GigersEscrow`) | Anyone can verify it on ArcScan. The app never trusts a frontend flag for payment status |
| Gig title, description, category, skills | Off-chain (Postgres). The contract stores the **hash** of this data | The server recomputes the hash on every read and ignores any record that does not match |
| Profiles | Off-chain | An edit requires a signed wallet message, checked on the server |
| Ratings | Off-chain | Requires a signed message. The server reads the gig from the contract and rejects the rating unless the gig is completed, a milestone was paid and the rater is the client or the freelancer. One rating per person per gig |
| Submitted work (images, notes, links) | Off-chain, **private** | See the next section |

Profile and rating data is clearly separated from on-chain data in the interface: the profile page labels what is *verified on-chain* and what is *self-reported*. Nothing in the app is fabricated: no fake users, reviews, earnings, badges or transactions. When there is no data, the app shows an empty state.

## Privacy of submitted work

The work delivered between a client and a freelancer is private to them.

- A user signs one free message (no gas) to open a 24-hour session
- On **every** request for work, the server reads the gig from the contract and allows access only to the **client**, the **chosen freelancer** and the **arbiter**. Anyone else, including other connected wallets, gets nothing
- Images are compressed on the freelancer's phone, and two versions are uploaded: the full image and a small **watermarked preview**
- **Before payment** the client sees only the watermarked preview and the *review links*. The full-quality image and the *final delivery links* stay locked
- **After the milestone is paid** (read from the contract), the client gets the full image with **Download** and **Copy** buttons, and the final links with **Copy** and **Open**
- Work is tied to the on-chain milestone by its hash, so a stale or forged submission is never shown

Limits we want to be honest about: a screenshot of the preview cannot be prevented (the watermark reduces its value), and everything recorded on-chain (who applied, amounts, hashes) is public by nature. What is private is the **content** of the delivered work.

## Smart contract

`contracts/GigersEscrow.sol` (Solidity ^0.8.20, deployed on Arc Testnet)

| Function | Who | What it does |
| --- | --- | --- |
| `createGig` | Client | Pulls the total USDC into escrow and records the milestones and the metadata hash |
| `applyToGig` | Freelancer | Records an application. Reverts for the client, for duplicates, for closed or expired gigs |
| `acceptWorker` | Client | Chooses an applicant; the gig becomes In Progress |
| `cancelGig` | Client | Refunds the deposit while the gig is still Open |
| `submitWork` | Chosen freelancer | Marks a milestone Submitted and records the work hash |
| `approveMilestone` | Client | Pays the freelancer for that milestone |
| `claimAfterTimeout` | Freelancer | Claims payment if the client has not responded for 7 days |
| `refundMilestone` | Client | Refunds an undelivered milestone after the deadline plus 3 days |
| `raiseDispute` / `resolveDispute` | Client or freelancer / Arbiter | Freezes a submitted milestone, then the arbiter pays the freelancer or refunds the client |

Security notes: a reentrancy guard on every function that moves tokens, state is updated before transfers, milestones are capped at 10, and every deposit and payment goes through the ERC-20 interface of Arc's native USDC (6 decimals).

## Tech stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Web3:** wagmi, viem, WalletConnect
- **Contract:** Solidity
- **Off-chain data:** Neon Postgres (serverless), accessed only from server routes
- **Hosting:** Vercel

## Try it as a judge

1. Add **Arc Testnet** to your wallet: RPC `https://rpc.testnet.arc.network`, Chain ID `5042002`, currency symbol `USDC`, explorer `https://testnet.arcscan.app`
2. Get free test USDC at https://faucet.circle.com (choose Arc Testnet). USDC is also the gas token on Arc
3. Open https://gigers-app.vercel.app and press **Connect**. On a phone, open the link inside your wallet's browser or use WalletConnect
4. Use two wallets to see the full flow:
   - Wallet A (client): **Post Gig**, add milestones, publish and fund
   - Wallet B (freelancer): open the gig and **Apply**
   - Wallet A: **Accept** the applicant
   - Wallet B: **Submit work** with an image and links
   - Wallet A: see the watermarked preview, then **Approve and pay**. The full image and final links unlock with Download and Copy
   - Both: **Rate** the finished project, and open the **Dashboard** and **Profile** pages

## Run locally

    npm install --legacy-peer-deps
    cp .env.example .env.local
    npm run dev

Environment variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string (server only) |
| `SESSION_SECRET` | Random 32-byte hex string used to sign sessions (server only) |
| `NEXT_PUBLIC_WC_PROJECT_ID` | WalletConnect project ID |
| `NEXT_PUBLIC_ARC_RPC` | Optional custom Arc RPC URL |

Database tables: `gig_metadata`, `gig_files`, `gig_work`, `profiles`, `ratings`. Secrets are set only in the hosting dashboard and are never committed to the repository.

## Testnet only, and known limitations

- The contract is **unaudited** and the arbiter is a single wallet. Do not use it with real funds
- Delivered images are converted to JPEG in the browser. PDFs and archives are not supported yet; use the final delivery links for large files
- A client cannot pull funds back once the freelancer has submitted work. They can approve, or open a dispute
- Translations other than English and Hausa are machine-assisted, and some newer interface strings still fall back to English
- The Create Gig form is currently English only

## Roadmap

- **Open competition mode:** several freelancers submit entries and the client picks one winner (needs a v2 contract)
- Independent arbitration instead of a single arbiter wallet
- File storage for more formats and larger files
- Notifications for new applicants and submissions
- A security audit before any mainnet use

## License

MIT
