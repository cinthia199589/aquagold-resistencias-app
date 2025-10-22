'use client';

import React from 'react';

// Reutilizamos los componentes visuales que ya tenemos definidos
// Para este ejemplo, los definimos aquí de nuevo. En un proyecto real, se importarían.
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string; }) => <div className={`bg-white dark:bg-slate-800 border-2 rounded-lg shadow-sm hover:shadow-md transition-all ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string; }) => <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string; }) => <h2 className={`text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white ${className}`}>{children}</h2>;
const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string; }) => <p className={`text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 ${className}`}>{children}</p>;
const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string; }) => <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;

// --- INICIO DE LA CORRECCIÓN ---
// Hemos añadido la propiedad "type" a la definición del botón.
interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: 'default' | 'outline' | 'ghost';
    type?: 'button' | 'submit' | 'reset';
}

const Button = ({ children, onClick, className = '', variant = 'default', type = 'button' }: ButtonProps) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-all h-9 sm:h-10 px-4 py-2 shadow-sm";
    const variantClasses = {
        default: 'bg-blue-500 text-white hover:bg-blue-600 border-0',
        outline: 'border-2 border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
        ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    };
    // Ahora pasamos el "type" al elemento <button> del HTML.
    return <button type={type} onClick={onClick} className={`${baseClasses} ${variantClasses[variant] || variantClasses.default} ${className}`}>{children}</button>;
};
// --- FIN DE LA CORRECCIÓN ---

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className="flex h-8 sm:h-10 w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 px-3 py-2 text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white shadow-sm transition-all placeholder:text-gray-400" />;
const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} className="text-xs sm:text-sm font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300" />;
const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => <select {...props} className="flex h-8 sm:h-10 w-full items-center justify-between rounded-lg border-2 border-gray-300 bg-white text-gray-900 px-3 py-2 text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white shadow-sm transition-all">{children}</select>;


export default function NewTestPage() {

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        // Lógica futura: Aquí enviaremos los datos a OneDrive
        alert('Formulario enviado. Próximo paso: Guardar en OneDrive.');
    };

    return (
        // Este layout principal debería venir de un archivo layout.tsx en la carpeta (dashboard)
        // Para simplificar, lo ponemos aquí por ahora.
        <main className="p-2 sm:p-4 md:p-6">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Crear Nueva Prueba de Resistencia</CardTitle>
                    <CardDescription>
                        Complete los siguientes campos para registrar un nuevo ensayo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                        <div className="space-y-1">
                            <Label htmlFor="lotNumber">Número de Lote</Label>
                            <Input id="lotNumber" placeholder="Ej: 0003540-25" required />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="provider">Proveedor</Label>
                            <Input id="provider" placeholder="Ej: AquaPro" required />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="pool">Piscina</Label>
                            <Input id="pool" placeholder="Ej: P-05" required />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="date">Fecha</Label>
                            <Input id="date" type="date" required />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="startTime">Hora de Inicio</Label>
                            <Input id="startTime" type="time" required />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="certificationType">Tipo de Certificación</Label>
                            <Select id="certificationType" required>
                                <option value="ASC">ASC</option>
                                <option value="CONVENCIONAL">CONVENCIONAL</option>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="so2Residuals">Residual SO2 MW</Label>
                            <Input id="so2Residuals" type="number" step="0.1" placeholder="Ej: 15.5" required />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="so2Bf">Residual SO2 BF</Label>
                            <Input id="so2Bf" type="number" step="0.1" placeholder="Ej: 12.3" required />
                        </div>
                        <div className="md:col-span-2 flex justify-end pt-2">
                            <Button type="submit">
                                Guardar y Empezar Ensayo
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
