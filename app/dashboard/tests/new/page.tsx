'use client';

import React from 'react';

// Reutilizamos los componentes visuales que ya tenemos definidos
// Para este ejemplo, los definimos aquí de nuevo. En un proyecto real, se importarían.
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string; }) => <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-md ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string; }) => <div className={`p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string; }) => <h2 className={`text-2xl font-bold text-gray-900 dark:text-white ${className}`}>{children}</h2>;
const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string; }) => <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>{children}</p>;
const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string; }) => <div className={`p-6 ${className}`}>{children}</div>;

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
    const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2";
    const variantClasses = {
        default: 'bg-blue-600 text-white hover:bg-blue-700',
        outline: 'border border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
        ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    };
    // Ahora pasamos el "type" al elemento <button> del HTML.
    return <button type={type} onClick={onClick} className={`${baseClasses} ${variantClasses[variant] || variantClasses.default} ${className}`}>{children}</button>;
};
// --- FIN DE LA CORRECCIÓN ---

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700" />;
const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" />;
const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => <select {...props} className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700">{children}</select>;


export default function NewTestPage() {

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        // Lógica futura: Aquí enviaremos los datos a OneDrive
        alert('Formulario enviado. Próximo paso: Guardar en OneDrive.');
    };

    return (
        // Este layout principal debería venir de un archivo layout.tsx en la carpeta (dashboard)
        // Para simplificar, lo ponemos aquí por ahora.
        <main className="p-4 md:p-6 lg:p-8">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Crear Nueva Prueba de Resistencia</CardTitle>
                    <CardDescription>
                        Complete los siguientes campos para registrar un nuevo ensayo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="lotNumber">Número de Lote</Label>
                            <Input id="lotNumber" placeholder="Ej: 0003540-25" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="provider">Proveedor</Label>
                            <Input id="provider" placeholder="Ej: AquaPro" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pool">Piscina</Label>
                            <Input id="pool" placeholder="Ej: P-05" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Fecha</Label>
                            <Input id="date" type="date" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="startTime">Hora de Inicio</Label>
                            <Input id="startTime" type="time" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="certificationType">Tipo de Certificación</Label>
                            <Select id="certificationType" required>
                                <option value="ASC">ASC</option>
                                <option value="CONVENCIONAL">CONVENCIONAL</option>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="so2Residuals">Residual SO2 MW</Label>
                            <Input id="so2Residuals" type="number" step="0.1" placeholder="Ej: 15.5" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="so2Bf">Residual SO2 BF</Label>
                            <Input id="so2Bf" type="number" step="0.1" placeholder="Ej: 12.3" required />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
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
