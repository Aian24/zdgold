'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  Scale,
  RefreshCw,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { useAuth, useSettings } from '@/lib/store';
import { LayawayContractWithDetails } from '@/lib/types';
import { formatCurrency, formatGrams } from '@/lib/gold-pricing';
import { calculateLayawayProgress, isInstallmentOverdue } from '@/lib/layaway';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';

export default function CustomerAccountPage() {
  const { user, openAuthModal } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<'layaway' | 'orders'>('layaway');
  const [contracts, setContracts] = useState<LayawayContractWithDetails[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Installment Payment Modal state
  const [selectedContract, setSelectedContract] = useState<LayawayContractWithDetails | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [contractsRes, ordersRes] = await Promise.all([
        fetch(`/api/layaway?userId=${user?.id || ''}`),
        fetch(`/api/orders?userId=${user?.id || ''}`),
      ]);

      const contractsData = await contractsRes.json();
      const ordersData = await ordersRes.json();

      if (contractsData.success) {
        setContracts(contractsData.contracts);
      }
      if (ordersData.success) {
        setOrders(ordersData.orders);
      }
    } catch (e) {
      console.error('Failed to load user portal data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const handleOpenPayModal = (contract: LayawayContractWithDetails, installment: any) => {
    setSelectedContract(contract);
    setSelectedInstallment(installment);
    setPayAmount(installment.amountDue.toString());
    setPaymentSuccessMsg(null);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract || !payAmount) return;

    setIsPaying(true);
    try {
      const res = await fetch(`/api/layaway/${selectedContract.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installmentId: selectedInstallment?.id,
          amount: parseFloat(payAmount),
          paymentMethod: 'CREDIT_CARD',
          notes: `Customer Portal Installment Payment for Contract ${selectedContract.contractNumber}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPaymentSuccessMsg(data.message);
        fetchUserData();
      } else {
        alert(data.error || 'Payment failed');
      }
    } catch (e) {
      console.error('Payment error', e);
      alert('Network error while recording installment.');
    } finally {
      setIsPaying(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 bg-[#FCFCF9]">
        <div className="w-16 h-16 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-700 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-neutral-900">
            Sign In to Access Your Layaway Hub
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
            View active 0% interest gold contracts, make monthly installment payments, and download certified purity invoices.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => openAuthModal('signin')}
            className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider"
          >
            Sign In with Google / Facebook / Email
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => openAuthModal('register')}
            className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider"
          >
            Create New Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 bg-[#FCFCF9] text-[#1A1A1A]">
      {/* Customer Header Banner */}
      <div className="rounded-3xl bg-white border border-gold-500/30 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4 text-center md:text-left">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border border-gold-500/40 shadow-xs flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gold-500/15 border border-gold-500/40 flex items-center justify-center text-2xl font-bold text-gold-700 flex-shrink-0 shadow-xs">
              💎
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <h1 className="text-xl sm:text-2xl font-black font-serif text-neutral-900">
                {user.name}
              </h1>
              <Badge variant="gold" size="sm">
                {user.role === 'ADMIN' ? 'EXECUTIVE ADMIN' : 'VERIFIED CLIENT'}
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 mt-1">{user.email} • {user.phone || '+63 917 123 4567'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchUserData}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            className="text-xs font-bold"
          >
            Refresh Status
          </Button>
          <Link href="/catalog">
            <Button variant="primary" size="sm" className="text-xs font-bold">
              Add More Fine Jewelry
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        tabs={[
          {
            id: 'layaway',
            label: 'Active Layaway Contracts',
            count: contracts.length,
            icon: <Lock className="w-4 h-4 text-gold-600" />,
          },
          {
            id: 'orders',
            label: 'Full Orders & Receipts',
            count: orders.length,
            icon: <FileText className="w-4 h-4 text-gold-600" />,
          },
        ]}
      />

      {/* Tab 1: Layaway Contracts Hub */}
      {activeTab === 'layaway' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-neutral-500">Retrieving Layaway Schedules...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white border border-gold-500/25 p-8 space-y-3 shadow-sm">
              <Lock className="w-10 h-10 text-gold-500/50 mx-auto" />
              <h3 className="text-base font-bold text-neutral-900 font-serif">No Active Layaway Contracts</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Lock in today&apos;s gold spot rate by choosing Layaway at checkout.
              </p>
              <Link href="/catalog">
                <Button variant="primary" size="sm" className="text-xs font-bold">
                  Browse Gold Items
                </Button>
              </Link>
            </div>
          ) : (
            contracts.map((contract) => {
              const progress = calculateLayawayProgress(contract.totalAmount, contract.remainingBalance);
              const paidSoFar = contract.totalAmount - contract.remainingBalance;

              return (
                <div
                  key={contract.id}
                  className="rounded-3xl bg-white border border-gold-500/30 p-6 md:p-8 space-y-6 shadow-sm"
                >
                  {/* Contract Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gold-500/20 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gold-700 text-sm md:text-base">
                          {contract.contractNumber}
                        </span>
                        <Badge
                          variant={contract.status === 'COMPLETED' ? 'emerald' : 'gold'}
                          size="sm"
                        >
                          {contract.status}
                        </Badge>
                        <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 font-mono font-bold">
                          <Lock className="w-3 h-3" />
                          Locked: ₱{contract.lockedGoldSpotRate}/g
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        Started on {new Date(contract.startDate).toLocaleDateString()} • {contract.termMonths} Months Term
                      </p>
                    </div>

                    <Link href={`/invoice/${contract.id}`}>
                      <Button variant="gold-outline" size="sm" className="text-xs font-bold" leftIcon={<FileText className="w-3.5 h-3.5" />}>
                        Download Official Invoice
                      </Button>
                    </Link>
                  </div>

                  {/* Progress Bar & Key Financials */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-neutral-700">
                        Contract Settlement Progress: <b className="text-gold-700 font-mono">{progress}% Paid</b>
                      </span>
                      <span className="text-neutral-600 font-mono">
                        {formatCurrency(paidSoFar)} / {formatCurrency(contract.totalAmount)}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden border border-neutral-200">
                      <div
                        className="bg-gradient-to-r from-gold-500 to-gold-400 h-full rounded-full transition-all duration-500 shadow-xs"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial Overview Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FAF8F2] border border-gold-500/20 text-xs">
                    <div>
                      <span className="text-neutral-500 block uppercase text-[10px] font-bold">Total Contract Value</span>
                      <span className="font-bold text-neutral-900 font-mono text-sm">{formatCurrency(contract.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block uppercase text-[10px] font-bold">Down Payment ({contract.downPaymentPercent}%)</span>
                      <span className="font-bold text-emerald-700 font-mono text-sm">{formatCurrency(contract.downPaymentAmount)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block uppercase text-[10px] font-bold">Remaining Balance</span>
                      <span className="font-bold text-gold-700 font-mono text-sm">{formatCurrency(contract.remainingBalance)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block uppercase text-[10px] font-bold">Monthly Installment</span>
                      <span className="font-bold text-neutral-800 font-mono text-sm">{formatCurrency(contract.monthlyInstallment)}/mo</span>
                    </div>
                  </div>

                  {/* Installments Timeline */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gold-600" />
                      Installment Timeline & Payment Schedule
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {contract.installments?.map((inst) => {
                        const isOverdue = isInstallmentOverdue(inst.dueDate, inst.status);
                        const isPaid = inst.status === 'PAID';

                        return (
                          <div
                            key={inst.id}
                            className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-colors ${
                              isPaid
                                ? 'bg-emerald-50/50 border-emerald-300'
                                : isOverdue
                                ? 'bg-rose-50/50 border-rose-300'
                                : 'bg-[#FAF8F2] border-gold-500/20'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-bold text-xs text-neutral-900 block">
                                  Installment #{inst.installmentNumber}
                                </span>
                                <span className="text-[11px] text-neutral-500 font-mono">
                                  Due: {new Date(inst.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                              <Badge
                                variant={isPaid ? 'emerald' : isOverdue ? 'rose' : 'amber'}
                                size="sm"
                              >
                                {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING'}
                              </Badge>
                            </div>

                            <div className="flex items-baseline justify-between pt-2 border-t border-neutral-200">
                              <span className="text-sm font-black text-neutral-900 font-mono">
                                {formatCurrency(inst.amountDue)}
                              </span>

                              {isPaid ? (
                                <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-mono font-bold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  {inst.receiptNumber || 'Receipt Ready'}
                                </span>
                              ) : (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleOpenPayModal(contract, inst)}
                                  className="text-xs py-1 px-3 h-7 font-bold"
                                >
                                  Pay Now
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Orders History */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white border border-gold-500/25 p-8 shadow-sm">
              <p className="text-xs text-neutral-500">No orders found.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl bg-white border border-gold-500/25 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gold-700 font-mono">{order.orderNumber}</span>
                    <Badge variant={order.status === 'DELIVERED' ? 'emerald' : 'gold'} size="sm">
                      {order.status}
                    </Badge>
                    <span className="text-xs text-neutral-500 font-mono">({order.orderType})</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Placed on {new Date(order.createdAt).toLocaleDateString()} • {order.orderItems?.length || 1} Item(s) • Total Weight: {formatGrams(order.totalGoldWeightGrams)}
                  </p>
                  {order.trackingNumber && (
                    <p className="text-xs text-emerald-700 font-mono mt-1 font-bold">
                      🚚 Tracking: {order.courier} - {order.trackingNumber}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-lg font-black text-neutral-900 font-mono">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <Link href={`/invoice/${order.id}`}>
                    <Button variant="secondary" size="sm" className="text-xs font-bold">
                      View Invoice
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Installment Payment Modal */}
      <Modal
        isOpen={!!selectedContract}
        onClose={() => setSelectedContract(null)}
        title="Pay Layaway Installment"
        subtitle={`Contract #${selectedContract?.contractNumber} • Installment #${selectedInstallment?.installmentNumber}`}
      >
        {paymentSuccessMsg ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-lg font-bold text-neutral-900 font-serif">Payment Processed!</h4>
            <p className="text-xs text-neutral-600">{paymentSuccessMsg}</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setSelectedContract(null)}
              className="text-xs font-bold"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-gold-500/20 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Remaining Contract Balance</span>
                <span className="font-bold text-gold-700 font-mono">
                  {formatCurrency(selectedContract?.remainingBalance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Scheduled Installment Amount</span>
                <span className="font-bold text-neutral-900 font-mono">
                  {formatCurrency(selectedInstallment?.amountDue)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase mb-1.5">
                Payment Amount (₱ PHP)
              </label>
              <input
                type="number"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full bg-white border border-gold-500/30 rounded-xl p-2.5 text-sm font-mono text-neutral-900 focus:border-gold-500 focus:outline-none shadow-xs"
                required
              />
            </div>

            <div className="p-3 bg-gold-500/10 rounded-xl border border-gold-500/25 text-xs text-neutral-700 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gold-600 flex-shrink-0" />
              <span>Simulated Payment: Card on file will be charged and official receipt issued instantly.</span>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setSelectedContract(null)}
                className="text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isPaying}
                className="text-xs font-bold"
              >
                Authorize Payment ({formatCurrency(parseFloat(payAmount || '0'))})
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
