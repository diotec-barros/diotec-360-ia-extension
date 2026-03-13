/**
 * Credit Purchase UI - v3.6.0
 * VS Code integration for buying Aethel Credits via PayPal
 * 
 * Part of DIOTEC 360 Sovereign Treasury
 * Angola Compliant - PayPal Integration
 */

import * as vscode from 'vscode';
import { Output } from '../utils/logger.js';

/**
 * Credit package type
 */
interface CreditPackage {
    credits: number;
    price: number;
    currency: string;
    name: string;
    description: string;
    icon: string;
    popular?: boolean;
}

/**
 * Credit packages available for purchase
 */
export const CREDIT_PACKAGES: Record<string, CreditPackage> = {
    starter: {
        credits: 1000,
        price: 9.99,
        currency: 'USD',
        name: 'Starter Package',
        description: '1,000 Aethel Credits',
        icon: '$(star)'
    },
    professional: {
        credits: 6000,
        price: 49.99,
        currency: 'USD',
        name: 'Professional Package',
        description: '6,000 Aethel Credits (20% bonus)',
        icon: '$(star-full)',
        popular: true
    },
    enterprise: {
        credits: 30000,
        price: 199.99,
        currency: 'USD',
        name: 'Enterprise Package',
        description: '30,000 Aethel Credits (50% bonus)',
        icon: '$(rocket)'
    }
};

/**
 * Credit Purchase Manager
 * 
 * Handles the complete purchase flow:
 * 1. User selects package
 * 2. System creates PayPal order
 * 3. User completes payment
 * 4. Credits are minted
 */
export class CreditPurchaseManager {
    private serverUrl: string;
    private output: Output;
    
    constructor(output: Output) {
        this.output = output;
        
        // Get server URL from configuration
        const config = vscode.workspace.getConfiguration('angoIA');
        this.serverUrl = config.get<string>('diotec360.endpoint', 'https://diotec-360-diotec-360-ia-judge.hf.space');
        
        this.output.info('[CREDIT PURCHASE] Manager initialized');
    }
    
    /**
     * Show credit purchase dialog
     */
    public async showPurchaseDialog(): Promise<void> {
        try {
            // Check if sovereign identity is configured
            const config = vscode.workspace.getConfiguration('angoIA');
            const publicKey = config.get<string>('diotec360.publicKeyHex');
            
            if (!publicKey) {
                const configure = await vscode.window.showWarningMessage(
                    'Sovereign Identity not configured. Configure now to purchase credits?',
                    'Configure',
                    'Cancel'
                );
                
                if (configure === 'Configure') {
                    await vscode.commands.executeCommand('diotec360.configureSovereignIdentity');
                }
                return;
            }
            
            // Show package selection
            const selectedPackage = await this.selectPackage();
            
            if (!selectedPackage) {
                return; // User cancelled
            }
            
            // Confirm purchase
            const confirmed = await this.confirmPurchase(selectedPackage);
            
            if (!confirmed) {
                return;
            }
            
            // Initiate purchase
            await this.initiatePurchase(selectedPackage);
            
        } catch (error) {
            this.output.error(`[CREDIT PURCHASE] Error: ${error}`);
            vscode.window.showErrorMessage(`Failed to purchase credits: ${error}`);
        }
    }
    
    /**
     * Select credit package
     */
    private async selectPackage(): Promise<string | undefined> {
        const items: vscode.QuickPickItem[] = Object.entries(CREDIT_PACKAGES).map(([_key, pkg]) => ({
            label: `${pkg.icon} ${pkg.name}`,
            description: `$${pkg.price} USD`,
            detail: `${pkg.description}${pkg.popular ? ' • MOST POPULAR' : ''}`,
            picked: pkg.popular || false,
            alwaysShow: true
        }));
        
        const selected = await vscode.window.showQuickPick(items, {
            title: '💰 Purchase Aethel Credits',
            placeHolder: 'Select a package',
            ignoreFocusOut: true
        });
        
        if (!selected) {
            return undefined;
        }
        
        // Extract package key from label
        const packageKey = Object.keys(CREDIT_PACKAGES).find(key => {
            const pkg = CREDIT_PACKAGES[key];
            return selected.label.includes(pkg.name);
        });
        
        return packageKey;
    }
    
    /**
     * Confirm purchase
     */
    private async confirmPurchase(packageKey: string): Promise<boolean> {
        const pkg = CREDIT_PACKAGES[packageKey];
        
        const message = `Purchase ${pkg.credits.toLocaleString()} Aethel Credits for $${pkg.price} USD via PayPal?`;
        
        const choice = await vscode.window.showInformationMessage(
            message,
            { modal: true },
            'Purchase with PayPal',
            'Cancel'
        );
        
        return choice === 'Purchase with PayPal';
    }
    
    /**
     * Initiate purchase with PayPal
     */
    private async initiatePurchase(packageKey: string): Promise<void> {
        try {
            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Creating PayPal checkout...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });
                
                // Get sovereign identity
                const config = vscode.workspace.getConfiguration('angoIA');
                const publicKey = config.get<string>('diotec360.publicKeyHex');
                
                if (!publicKey) {
                    throw new Error('Sovereign identity not configured');
                }
                
                progress.report({ increment: 30, message: 'Contacting server...' });
                
                // Create PayPal order
                const response = await fetch(`${this.serverUrl}/api/treasury/purchase`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        package: packageKey,
                        user_public_key: publicKey,
                        payment_method: 'paypal',
                        return_url: `${vscode.env.uriScheme}://diotec360/treasury/success`,
                        cancel_url: `${vscode.env.uriScheme}://diotec360/treasury/cancel`
                    })
                });
                
                progress.report({ increment: 60, message: 'Opening PayPal...' });
                
                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Server error: ${error}`);
                }
                
                const data = await response.json();
                
                if (!data.ok || !data.approval_url) {
                    throw new Error('Failed to create PayPal order');
                }
                
                progress.report({ increment: 90, message: 'Redirecting to PayPal...' });
                
                // Open PayPal checkout in browser
                await vscode.env.openExternal(vscode.Uri.parse(data.approval_url));
                
                progress.report({ increment: 100 });
                
                // Show success message
                vscode.window.showInformationMessage(
                    `PayPal checkout opened. Complete payment to receive ${CREDIT_PACKAGES[packageKey as keyof typeof CREDIT_PACKAGES].credits.toLocaleString()} credits.`,
                    'OK'
                );
                
                this.output.info(
                    `[CREDIT PURCHASE] PayPal checkout created: ${data.order_id} (package: ${packageKey})`
                );
            });
            
        } catch (error) {
            this.output.error(`[CREDIT PURCHASE] Failed to initiate purchase: ${error}`);
            throw error;
        }
    }
    
    /**
     * Get current credit balance
     */
    public async getBalance(): Promise<number> {
        try {
            const config = vscode.workspace.getConfiguration('angoIA');
            const publicKey = config.get<string>('diotec360.publicKeyHex');
            
            if (!publicKey) {
                return 0;
            }
            
            const response = await fetch(
                `${this.serverUrl}/api/treasury/balance?public_key=${publicKey}`
            );
            
            if (!response.ok) {
                throw new Error('Failed to get balance');
            }
            
            const data = await response.json();
            
            return data.credits || 0;
            
        } catch (error) {
            this.output.error(`[CREDIT PURCHASE] Failed to get balance: ${error}`);
            return 0;
        }
    }
    
    /**
     * Show credit balance
     */
    public async showBalance(): Promise<void> {
        try {
            const balance = await this.getBalance();
            
            const message = `Your current balance: ${balance.toLocaleString()} Aethel Credits`;
            
            const choice = await vscode.window.showInformationMessage(
                message,
                'Buy More Credits',
                'Close'
            );
            
            if (choice === 'Buy More Credits') {
                await this.showPurchaseDialog();
            }
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get balance: ${error}`);
        }
    }
}

/**
 * Register credit purchase commands
 */
export function registerCreditPurchaseCommands(
    context: vscode.ExtensionContext,
    output: Output
): void {
    const purchaseManager = new CreditPurchaseManager(output);
    
    // Command: Buy Credits
    const buyCreditsCommand = vscode.commands.registerCommand(
        'diotec360.buyCredits',
        async () => {
            await purchaseManager.showPurchaseDialog();
        }
    );
    
    // Command: View Balance
    const viewBalanceCommand = vscode.commands.registerCommand(
        'diotec360.viewBalance',
        async () => {
            await purchaseManager.showBalance();
        }
    );
    
    context.subscriptions.push(buyCreditsCommand, viewBalanceCommand);
    
    output.info('[CREDIT PURCHASE] Commands registered');
}
