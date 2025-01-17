import { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import MembersListFilters from "./members/list/MembersListFilters";
import MembersListView from "./members/list/MembersListView";

interface MembersListProps {
  searchTerm: string;
  userRole: string | null;
}

const MembersList = ({ searchTerm: initialSearchTerm, userRole }: MembersListProps) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  const { data: collectorInfo } = useQuery({
    queryKey: ['collector-info'],
    queryFn: async () => {
      if (userRole !== 'collector') {
        console.log('Not a collector, skipping collector info fetch');
        return null;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return null;
      }

      console.log('Fetching collector info for member:', user.user_metadata.member_number);
      const { data: collectorData, error } = await supabase
        .from('members_collectors')
        .select('id, name, phone, prefix, number, email, active, created_at, updated_at')
        .eq('member_number', user.user_metadata.member_number)
        .maybeSingle();

      if (error) {
        console.error('Error fetching collector info:', error);
        throw error;
      }

      console.log('Collector info fetched:', collectorData);
      return collectorData;
    },
    enabled: userRole === 'collector',
  });

  return (
    <div className="w-full px-2 sm:px-0 space-y-4 sm:space-y-6">
      <MembersListFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <MembersListView
        searchTerm={searchTerm}
        userRole={userRole}
        collectorInfo={collectorInfo}
      />
    </div>
  );
};

export default MembersList;