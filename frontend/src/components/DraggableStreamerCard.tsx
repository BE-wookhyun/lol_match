import { useDraggable } from '@dnd-kit/core';
import type { Streamer } from '../types';
import StreamerCard from './StreamerCard';

interface DraggableStreamerCardProps {
  streamer: Streamer;
}

export default function DraggableStreamerCard({ streamer }: DraggableStreamerCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool-${streamer.seq}`,
    data: { streamer },
  });

  const style = { opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <StreamerCard streamer={streamer} />
    </div>
  );
}
