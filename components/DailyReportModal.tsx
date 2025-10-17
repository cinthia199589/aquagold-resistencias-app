'use client';

import React, { useState } from 'react';
import { X, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { getTestsByDate } from '../lib/firestoreService';
import { exportDailyReport, generateDailyReportBlob } from '../lib/excelExport';
import { saveDailyReportToOneDrive } from '../lib/graphService';
import { useMsal } from '@azure/msal-react';
import { DailyReport } from '../lib/types';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite"]
};

const DailyReportModal: React.FC<DailyReportModalProps> = ({ isOpen, onClose }) => {
  const { instance } = useMsal();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<DailyReport | null>(null);

  if (!isOpen) return null;

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const tests = await getTestsByDate(selectedDate);
      
      const report: DailyReport = {
        date: selectedDate,
        tests,
        totalTests: tests.length,
        completedTests: tests.filter(t => t.isCompleted).length
      };
      
      setReportData(report);
      
      if (tests.length === 0) {
        alert('No se encontraron pruebas para esta fecha.');
      }
    } catch (error: any) {
      alert(`Error al generar reporte: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (reportData) {
      exportDailyReport(reportData);
    }
  };

  const handleSaveToOneDrive = async () => {
    if (!reportData) return;
    
    setIsLoading(true);
    try {
      const blob = generateDailyReportBlob(reportData);
      await saveDailyReportToOneDrive(instance, loginRequest.scopes, selectedDate, blob);
      alert('✅ Reporte guardado en OneDrive exitosamente.');
    } catch (error: any) {
      alert(`❌ Error al guardar en OneDrive: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-2xl font-bold">Generar Reporte Diario</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Seleccionar Fecha</label>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex h-10 w-full pl-10 rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700"
                />
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Generando...' : 'Generar'}
              </button>
            </div>
          </div>

          {reportData && (
            <div className="border dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold mb-2">Resumen del Reporte</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Fecha:</p>
                  <p className="font-medium">{format(new Date(reportData.date), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Total de Pruebas:</p>
                  <p className="font-medium">{reportData.totalTests}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Completadas:</p>
                  <p className="font-medium text-green-600">{reportData.completedTests}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">En Progreso:</p>
                  <p className="font-medium text-yellow-600">{reportData.totalTests - reportData.completedTests}</p>
                </div>
              </div>

              {reportData.tests.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Lotes incluidos:</p>
                  <div className="flex flex-wrap gap-2">
                    {reportData.tests.map(test => (
                      <span key={test.id} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                        {test.lotNumber}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 p-6 border-t dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cerrar
          </button>
          {reportData && (
            <>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download size={18} />
                Descargar Excel
              </button>
              <button
                onClick={handleSaveToOneDrive}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Download size={18} />
                {isLoading ? 'Guardando...' : 'Guardar en OneDrive'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyReportModal;