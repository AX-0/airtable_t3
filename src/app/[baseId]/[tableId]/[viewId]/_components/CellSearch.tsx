import { useDebounce } from "@uidotdev/usehooks";
import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { Search } from "lucide-react"; 

type Props = {
  viewId: number;
  searchTerm: string;
};

export default function CellSearch({ viewId, searchTerm }: Props) {
    const utils = api.useUtils();
    const updateViewSearch = api.view.updateViewSearch.useMutation({
        onSuccess: async () => {
            await utils.table.getTableData.invalidate();
            await utils.view.getSearchTerm.invalidate({ viewId });
        },
    });

    const [text, setText] = useState(searchTerm);

    useEffect(() => {
        if (searchTerm !== text) setText(searchTerm);
    }, [searchTerm]);

    const debounced = useDebounce(text, 300);

    const lastSent = useRef(searchTerm);
    useEffect(() => {
        if (debounced === lastSent.current) return;
        
        lastSent.current = debounced;
        updateViewSearch.mutate({ viewId, search: debounced });
    }, [debounced, viewId]);

    return (
        <div className="flex items-center px-4 py-1.5 bg-white rounded-full">
            <Search className="w-4 h-4 text-gray-500" />  
            <input
            className="border-none outline-none px-2"
                placeholder={"Search all columns…"}
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
        </div>

    );
  }
  