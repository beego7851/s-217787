import { useState } from "react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Banknote } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberNumber: string;
  memberName: string;
  collectorInfo: { name: string | null } | null;
}

const PaymentDialog = ({ isOpen, onClose, memberId, memberNumber, memberName, collectorInfo }: PaymentDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('yearly');
  const [paymentAmount, setPaymentAmount] = useState<string>('40');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash');

  // Handle payment type change
  const handlePaymentTypeChange = (value: string) => {
    setSelectedPaymentType(value);
    if (value === 'yearly') {
      setPaymentAmount('40');
    } else {
      setPaymentAmount('');
    }
  };

  const createPaymentRequest = useMutation({
    mutationFn: async ({ 
      memberId, 
      memberNumber, 
      amount, 
      paymentType, 
      paymentMethod,
      collectorId 
    }: {
      memberId: string;
      memberNumber: string;
      amount: number;
      paymentType: string;
      paymentMethod: 'cash' | 'bank_transfer';
      collectorId: string;
    }) => {
      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          member_id: memberId,
          member_number: memberNumber,
          amount,
          payment_type: paymentType,
          payment_method: paymentMethod,
          collector_id: collectorId,
          status: 'pending'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Payment request created",
        description: "An admin will review and approve the payment.",
      });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error creating payment request",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handlePaymentSubmit = async () => {
    if (!paymentAmount || !collectorInfo?.name) return;

    const { data: collectorData } = await supabase
      .from('members_collectors')
      .select('id')
      .eq('name', collectorInfo.name)
      .single();

    if (!collectorData?.id) {
      toast({
        title: "Error",
        description: "Collector information not found",
        variant: "destructive",
      });
      return;
    }

    createPaymentRequest.mutate({
      memberId,
      memberNumber,
      amount: parseFloat(paymentAmount),
      paymentType: selectedPaymentType,
      paymentMethod,
      collectorId: collectorData.id
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-dashboard-card border-dashboard-accent1/20">
        <DialogHeader>
          <DialogTitle className="text-dashboard-accent2">Record Payment for {memberName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block text-dashboard-text">Payment Type</label>
            <ToggleGroup
              type="single"
              value={selectedPaymentType}
              onValueChange={handlePaymentTypeChange}
              className="justify-start gap-4"
            >
              <ToggleGroupItem 
                value="yearly" 
                className="h-12 px-6 data-[state=on]:bg-dashboard-accent1 data-[state=on]:text-white border-dashboard-accent1/20"
              >
                Yearly Payment
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="emergency" 
                className="h-12 px-6 data-[state=on]:bg-dashboard-accent1 data-[state=on]:text-white border-dashboard-accent1/20"
              >
                Emergency Collection
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-3 block text-dashboard-text">Amount</label>
            <Input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter amount"
              className="border-dashboard-accent1/20 bg-dashboard-dark h-12 text-lg"
              readOnly={selectedPaymentType === 'yearly'}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-3 block text-dashboard-text">Payment Method</label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 h-12 ${
                  paymentMethod === 'cash' 
                    ? 'bg-dashboard-accent1 hover:bg-dashboard-accent1/80' 
                    : 'border-dashboard-accent1/20 hover:bg-dashboard-accent1/10'
                }`}
              >
                <Banknote className="w-5 h-5 mr-2" />
                Cash
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'bank_transfer' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`flex-1 h-12 ${
                  paymentMethod === 'bank_transfer' 
                    ? 'bg-dashboard-accent1 hover:bg-dashboard-accent1/80' 
                    : 'border-dashboard-accent1/20 hover:bg-dashboard-accent1/10'
                }`}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Bank Transfer
              </Button>
            </div>
          </div>
          
          <Button 
            className="w-full bg-dashboard-accent2 hover:bg-dashboard-accent2/80 text-white h-12 text-lg font-medium"
            onClick={handlePaymentSubmit}
            disabled={!paymentAmount || createPaymentRequest.isPending}
          >
            Submit Payment Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;