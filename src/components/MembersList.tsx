import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Database } from '@/integrations/supabase/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { CreditCard, Cash } from "lucide-react";
import CollectorPaymentSummary from './CollectorPaymentSummary';

interface MembersListProps {
  searchTerm: string;
  userRole: string | null;
}

const MembersList = ({ searchTerm, userRole }: MembersListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('yearly');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const { data: collectorInfo } = useQuery({
    queryKey: ['collector-info'],
    queryFn: async () => {
      if (userRole !== 'collector') return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: collectorData } = await supabase
        .from('members_collectors')
        .select('name')
        .eq('member_number', user.user_metadata.member_number)
        .single();

      return collectorData;
    },
    enabled: userRole === 'collector',
  });

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
    },
    onError: (error) => {
      toast({
        title: "Error creating payment request",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handlePaymentSubmit = async (memberId: string, memberNumber: string) => {
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

    setSelectedMemberId(null);
    setPaymentAmount('');
  };

  const { data: members, isLoading, error } = useQuery({
    queryKey: ['members', searchTerm, userRole],
    queryFn: async () => {
      console.log('Fetching members...');
      let query = supabase
        .from('members')
        .select('*');
      
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%,collector.ilike.%${searchTerm}%`);
      }

      if (userRole === 'collector') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: collectorData } = await supabase
            .from('members_collectors')
            .select('name')
            .eq('member_number', user.user_metadata.member_number)
            .single();

          if (collectorData?.name) {
            console.log('Filtering members for collector:', collectorData.name);
            query = query.eq('collector', collectorData.name);
          }
        }
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }
      
      console.log('Members query result:', data);
      return data as Member[];
    },
  });

  return (
    <div className="space-y-6">
      <ScrollArea className="h-[600px] w-full rounded-md">
        <Accordion type="single" collapsible className="space-y-4">
          {members?.map((member) => (
            <AccordionItem 
              key={member.id} 
              value={member.id}
              className="bg-dashboard-card border-white/10 shadow-lg hover:border-dashboard-accent1/50 transition-all duration-300 p-6 rounded-lg border"
            >
              <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-6 w-full">
                <Avatar className="h-16 w-16 border-2 border-dashboard-accent1/20">
                  <AvatarFallback className="bg-dashboard-accent1/20 text-lg text-dashboard-accent1">
                    {member.full_name?.charAt(0) || 'M'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex justify-between items-center w-full">
                  <div>
                    <h3 className="text-xl font-medium text-dashboard-accent2 mb-1">{member.full_name}</h3>
                    <p className="bg-dashboard-accent1/10 px-3 py-1 rounded-full inline-flex items-center">
                      <span className="text-dashboard-accent1">Member #</span>
                      <span className="text-dashboard-accent2 font-medium ml-1">{member.member_number}</span>
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    member.status === 'active' 
                      ? 'bg-dashboard-accent3/20 text-dashboard-accent3' 
                      : 'bg-dashboard-muted/20 text-dashboard-muted'
                  }`}>
                    {member.status || 'Pending'}
                  </div>
                </div>
              </div>
              </AccordionTrigger>
              
              <AccordionContent>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-dashboard-muted mb-1">Contact Information</p>
                  <p className="text-dashboard-text">{member.email || 'No email provided'}</p>
                  <p className="text-dashboard-text">{member.phone || 'No phone provided'}</p>
                </div>
                <div>
                  <p className="text-dashboard-muted mb-1">Address</p>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-dashboard-text">
                      {member.address || 'No address provided'}
                      {member.town && `, ${member.town}`}
                      {member.postcode && ` ${member.postcode}`}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-dashboard-muted mb-1">Membership Type</p>
                    <p className="text-dashboard-text">{member.membership_type || 'Standard'}</p>
                  </div>
                  <div>
                    <p className="text-dashboard-muted mb-1">Collector</p>
                    <p className="text-dashboard-text">{member.collector || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-dashboard-muted mb-1">Status</p>
                    <p className="text-dashboard-text">{member.status || 'Pending'}</p>
                  </div>
                </div>
              </div>
                
                {userRole === 'collector' && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <Dialog open={selectedMemberId === member.id} onOpenChange={(open) => !open && setSelectedMemberId(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setSelectedMemberId(member.id)}
                        >
                          Record Payment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Record Payment for {member.full_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Payment Type</label>
                            <Select
                              value={selectedPaymentType}
                              onValueChange={setSelectedPaymentType}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yearly">Yearly Payment</SelectItem>
                                <SelectItem value="emergency">Emergency Collection</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-1 block">Amount</label>
                            <Input
                              type="number"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              placeholder="Enter amount"
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-1 block">Payment Method</label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                                onClick={() => setPaymentMethod('cash')}
                                className="flex-1"
                              >
                                <Cash className="w-4 h-4 mr-2" />
                                Cash
                              </Button>
                              <Button
                                type="button"
                                variant={paymentMethod === 'bank_transfer' ? 'default' : 'outline'}
                                onClick={() => setPaymentMethod('bank_transfer')}
                                className="flex-1"
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Bank Transfer
                              </Button>
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full"
                            onClick={() => handlePaymentSubmit(member.id, member.member_number)}
                            disabled={!paymentAmount || createPaymentRequest.isPending}
                          >
                            Submit Payment Request
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>

      {userRole === 'collector' && collectorInfo && (
        <CollectorPaymentSummary collectorName={collectorInfo.name} />
      )}
    </div>
  );
};

export default MembersList;
