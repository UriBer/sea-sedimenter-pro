# Sea Sedimenter

A shipboard weighing assistant for sediment analysis with robust uncertainty calculation. This application helps measure and analyze sediment samples on vessels, accounting for scale bias, measurement uncertainty, and motion-induced errors.

## Features

- **Tare Configuration**: Calibrate scale bias by measuring empty containers multiple times (5-10 samples)
- **Base & Final Measurements**: Record initial and processed sample weights with statistical analysis
- **Uncertainty Propagation**: Advanced calculations combining systematic (bias) and random (precision) uncertainties
- **Statistical Analysis**: 
  - Trimmed mean calculations (10% outlier removal)
  - 95% confidence intervals with k-factor interpolation
  - Standard error and total combined uncertainty
- **IMU Motion Correction**: Optional accelerometer-based correction for wave-induced motion errors
- **Multi-language Support**: English, Hebrew (עברית), Arabic (العربية), and Russian (Русский)
- **Dark Mode**: Toggle between light and dark themes
- **Report Generation**: Save measurement reports with metadata (operator, vessel, date, load number, dredge area)
- **History Management**: View and manage saved reports locally
- **Single Shot Mode**: Option for gross-only measurements without tare correction

## Usage Workflow

- Live application available at:
  https://sea-sedimenter-326228314207.us-west1.run.app 

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **LocalStorage** - Data persistence

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sea-sedimenter-pro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set the `GEMINI_API_KEY` in `.env.local` if you plan to use Gemini API features:
   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Usage Workflow

### 1. Tare Configuration
- Measure an empty container 5-10 times
- The app calculates the median bias and uncertainty range
- Set the tare as active to apply corrections to subsequent measurements

### 2. Base Measurement
- Measure the initial full sample multiple times (recommended: 3-5+ measurements)
- The app calculates statistics including mean, median, trimmed mean, and uncertainty bands

### 3. Final Measurement
- After processing (drying, sieving, etc.), measure the remaining sample multiple times
- Same statistical analysis is performed

### 4. Compute Results
- Once both base and final measurements are complete, click "COMPUTE CHANGE"
- The app calculates:
  - Weight change ratio: `(W_base - W_final) / W_base`
  - Percentage change with 95% confidence intervals
  - Uncertainty propagation accounting for both measurement sessions

### 5. Save Report
- Fill in metadata (operator, vessel, date, load number, dredge area)
- Save locally or share via WhatsApp

## Project Structure

```
sea-sedimenter-pro/
├── components/          # React components (legacy location)
├── src/
│   ├── components/      # Main React components
│   │   ├── HelpModal.tsx
│   │   ├── HistoryModal.tsx
│   │   ├── ReportForm.tsx
│   │   ├── ResultCard.tsx
│   │   ├── SensorBadge.tsx
│   │   ├── SessionPanel.tsx
│   │   └── TarePanel.tsx
│   ├── contexts/        # React contexts
│   │   └── SettingsContext.tsx  # Theme, language, settings
│   ├── hooks/          # Custom React hooks
│   │   └── useSensors.ts
│   ├── locales.ts      # Multi-language translations
│   ├── measurement/    # Measurement calculation logic
│   │   └── RatioCalculator.ts
│   ├── session/        # Session management
│   │   ├── MeasurementSession.ts
│   │   └── TareManager.ts
│   ├── types.ts        # TypeScript type definitions
│   ├── ui/             # UI components
│   └── utils/          # Utility functions
│       ├── kFactor.ts   # K-factor interpolation for confidence intervals
│       └── math.ts      # Mathematical utilities
├── measurement/        # Measurement calculators
│   ├── RatioCalculator.ts
│   ├── SessionCalculator.ts
│   └── SimpleMeasurementCalculator.ts
├── session/            # Session managers
│   ├── ManualSessionManager.ts
│   ├── SimpleMeasurementManager.ts
│   └── TareManager.ts
├── utils/              # Utility functions
│   └── kFactor.ts
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
├── types.ts            # Type definitions
├── vite.config.ts     # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Development

### Available Scripts

- `npm run dev` - Start development server (runs on port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Key Concepts

**Uncertainty Calculation:**
- **Systematic Uncertainty (Bias)**: Median of tare samples, uncertainty = half the range
- **Random Uncertainty (Precision)**: Standard error from repeated measurements (with 10% trimming)
- **Total Combined Uncertainty**: `σ_total = √(SE² + T²)`
- **95% Confidence Band**: `±k * σ_total` where k is interpolated based on effective sample size

**IMU Motion Correction:**
- Uses linear regression: `W_adj = W_raw - (b + k · az)`
- Slope `k` is determined during tare calibration
- Minimizes variance of residuals against vertical acceleration

## License

Licensed under GNU GPLv3

## Disclaimer

This application is provided for scientific and industrial use and provided as is without any warranty. Always verify critical measurements with appropriate quality control procedures.

---

© 2025 even-derech-it.com
