import React, { useState, useEffect } from 'react';
import { X, QrCode, Printer, MapPin, Sparkles, Check, Download } from 'lucide-react';
import QRCode from 'qrcode';

interface QRGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTable: string | null;
  onSelectTable: (tableNum: string) => void;
}

const PRESET_TABLES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'Patio 1', 'Bar 1'];

export const QRGeneratorModal: React.FC<QRGeneratorModalProps> = ({
  isOpen,
  onClose,
  activeTable,
  onSelectTable,
}) => {
  const [selectedTableInput, setSelectedTableInput] = useState<string>(activeTable || '05');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (activeTable) {
      setSelectedTableInput(activeTable);
    }
  }, [activeTable]);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const fullTableUrl = `${currentOrigin}?table=${encodeURIComponent(selectedTableInput)}`;

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(fullTableUrl, {
      width: 240,
      margin: 2,
      color: {
        dark: '#1c1917', // stone-900
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Error generating table QR code:', err));
  }, [fullTableUrl, isOpen]);

  if (!isOpen) return null;

  const handleActivateTable = (tableNum: string) => {
    setSelectedTableInput(tableNum);
    onSelectTable(tableNum);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-2xl my-8 text-stone-900 p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-stone-900 text-amber-400 font-bold shadow-xs">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                Table QR Code Manager
              </h2>
              <p className="text-xs text-stone-500">
                Generate, print, or test instant Table QR Codes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Card Display */}
        <div className="flex flex-col sm:flex-row items-center gap-6 bg-stone-50 p-5 rounded-2xl border border-stone-200">
          
          {/* Printable QR Code Card */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-md text-stone-900 shrink-0 space-y-2 text-center w-52 border border-stone-200">
            <div className="flex items-center space-x-1 text-amber-800 font-black text-sm tracking-tight">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Brewnet Cafe</span>
            </div>

            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt={`Table ${selectedTableInput} QR Code`} className="w-40 h-40" />
            ) : (
              <div className="w-40 h-40 bg-stone-100 rounded animate-pulse" />
            )}

            <div className="bg-amber-100 border border-amber-300 px-3 py-1 rounded-full text-xs font-black text-amber-900">
              TABLE #{selectedTableInput}
            </div>
            <p className="text-[9px] text-stone-500 font-medium">Scan to order from table</p>
          </div>

          {/* Controls & Preset Selector */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5">
                Select or Custom Table
              </label>
              <input
                type="text"
                value={selectedTableInput}
                onChange={(e) => setSelectedTableInput(e.target.value)}
                placeholder="Enter Table Number e.g. 05"
                className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-600"
              />
            </div>

            {/* Presets Grid */}
            <div>
              <span className="block text-[11px] text-stone-500 mb-1.5 font-semibold">
                Quick Table Select (Test Simulator):
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {PRESET_TABLES.map((t) => {
                  const isSelected = selectedTableInput === t;
                  return (
                    <button
                      key={t}
                      onClick={() => handleActivateTable(t)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-2xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* URL Display */}
            <div>
              <span className="block text-[10px] text-stone-500 mb-1 font-semibold">Direct Table Link:</span>
              <div className="p-2 bg-white border border-stone-200 rounded-lg text-[10px] text-amber-900 font-mono truncate">
                {fullTableUrl}
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleActivateTable(selectedTableInput)}
            className="flex-1 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>Simulate Order for Table #{selectedTableInput}</span>
          </button>

          <a
            href={qrCodeUrl}
            download={`brewnet-table-${selectedTableInput}-qr.png`}
            className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 font-semibold text-xs flex items-center justify-center space-x-1.5"
          >
            <Download className="w-4 h-4 text-stone-700" />
            <span>Save Image</span>
          </a>
        </div>

      </div>
    </div>
  );
};
