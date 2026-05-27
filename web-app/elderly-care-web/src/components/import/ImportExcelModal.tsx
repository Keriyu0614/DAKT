import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './ImportExcelModal.css';

interface ImportExcelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (file: File) => Promise<{ message: string; importedCount: number; errors?: string[] }>;
    title: string;
    description: string;
    templateData: any[];
    templateFilename: string;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
    isOpen,
    onClose,
    onImport,
    title,
    description,
    templateData,
    templateFilename
}) => {
    const { t } = useTranslation();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{ message: string; importedCount: number; errors?: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (file: File) => {
        if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.type === 'application/vnd.ms-excel' ||
            file.name.endsWith('.xlsx') || 
            file.name.endsWith('.xls')) {
            setSelectedFile(file);
            setResult(null);
        } else {
            alert('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        setImporting(true);
        try {
            const result = await onImport(selectedFile);
            setResult(result);
        } catch (error: any) {
            setResult({
                message: error.response?.data?.message || 'Có lỗi xảy ra khi nhập dữ liệu',
                importedCount: 0,
                errors: [error.response?.data?.detail || error.message]
            });
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        // Create CSV content from template data
        const headers = Object.keys(templateData[0]);
        const csvContent = [
            headers.join(','),
            ...templateData.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes in CSV
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', templateFilename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClose = () => {
        setSelectedFile(null);
        setResult(null);
        setImporting(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="import-modal-overlay">
            <div className="import-modal">
                <div className="import-modal-header">
                    <h2><FileSpreadsheet size={24} /> {title}</h2>
                    <button className="close-btn" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="import-modal-content">
                    <p className="import-description">{description}</p>

                    {/* Template Download */}
                    {/* <div className="template-section">
                        <h3>Bước 1: Tải template mẫu</h3>
                        <button className="download-template-btn" onClick={downloadTemplate}>
                            <Download size={16} />
                            Tải template Excel mẫu
                        </button>
                        <small>Sử dụng template này để đảm bảo định dạng dữ liệu chính xác</small>
                    </div> */}

                    {/* File Upload */}
                    <div className="upload-section">
                        {/* <h3>Bước 2: Chọn file Excel để import</h3> */}
                        <div
                            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                        >
                            <Upload size={48} className="upload-icon" />
                            <p>Kéo thả file Excel vào đây</p>
                            <span>hoặc</span>
                            <label className="upload-link">
                                Chọn file từ máy tính
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    hidden
                                    onChange={handleFileInput}
                                />
                            </label>
                        </div>

                        {selectedFile && (
                            <div className="selected-file">
                                <FileSpreadsheet size={16} />
                                <span>{selectedFile.name}</span>
                                <small>({(selectedFile.size / 1024).toFixed(1)} KB)</small>
                            </div>
                        )}
                    </div>

                    {/* Import Result */}
                    {result && (
                        <div className={`import-result ${result.errors && result.errors.length > 0 ? 'has-errors' : 'success'}`}>
                            <div className="result-header">
                                {result.errors && result.errors.length > 0 ? (
                                    <AlertCircle size={20} className="error-icon" />
                                ) : (
                                    <CheckCircle size={20} className="success-icon" />
                                )}
                                <span>{result.message}</span>
                            </div>
                            
                            {result.errors && result.errors.length > 0 && (
                                <div className="error-details">
                                    <h4>Chi tiết lỗi:</h4>
                                    <ul>
                                        {result.errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="import-modal-footer">
                    <button className="cancel-btn" onClick={handleClose}>
                        Hủy
                    </button>
                    <button 
                        className="import-btn" 
                        onClick={handleImport}
                        disabled={!selectedFile || importing}
                    >
                        {importing ? 'Đang import...' : 'Import dữ liệu'}
                    </button>
                </div>
            </div>
        </div>
    );
};