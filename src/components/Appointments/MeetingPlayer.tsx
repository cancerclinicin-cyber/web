import { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import type { RootState } from '../../../store';
import { minimizeMeeting, expandMeeting, closeMeeting } from './meetingSlice';

interface MeetingPlayerProps {
  link: string;
  onClose: () => void;
}

export default function MeetingPlayer({ link, onClose }: MeetingPlayerProps) {
  const dispatch = useDispatch();
  const { isMinimized, isExpanded } = useSelector((state: RootState) => state.meeting);
  const playerRef = useRef<HTMLDivElement>(null);

  const handleMinimize = () => {
    dispatch(minimizeMeeting());
  };

  const handleExpand = () => {
    dispatch(expandMeeting());
  };

  const handleClose = () => {
    dispatch(closeMeeting());
    onClose();
  };

  return (
    <div
      ref={playerRef}
      className={`fixed z-50 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-2xl overflow-hidden transition-all duration-500 ${
        isMinimized
          ? 'bottom-4 right-4 w-96 h-72'
          : isExpanded
          ? 'top-0 left-0 w-full h-full'
          : 'bottom-4 right-4 w-96 h-72'
      }`}
    >
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-indigo-600 border-b-2 border-blue-300">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-white">Live Meeting</span>
        </div>
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <button
              onClick={handleMinimize}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors duration-200 group"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            </button>
          ) : (
            <button
              onClick={handleExpand}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors duration-200 group"
              title="Expand"
            >
              <Maximize2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-2 hover:bg-red-600 rounded-lg transition-colors duration-200 group"
            title="Close"
          >
            <X className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
      <div className="relative w-full h-full bg-gray-900">
        <iframe
          src={link}
          className="w-full h-full border-0"
          allow="camera; microphone; fullscreen"
          title="Meeting"
        />
        {!isExpanded && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            Click to expand
          </div>
        )}
      </div>
    </div>
  );
}