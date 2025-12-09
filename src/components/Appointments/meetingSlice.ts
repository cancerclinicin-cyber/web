import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface MeetingPlayerState {
  link: string | null;
  isOpen: boolean;
  isMinimized: boolean;
  isExpanded: boolean;
}

const initialState: MeetingPlayerState = {
  link: null,
  isOpen: false,
  isMinimized: false,
  isExpanded: true,
};

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    startMeeting: (state, action: PayloadAction<string>) => {
      state.link = action.payload;
      state.isOpen = true;
      state.isMinimized = false;
      state.isExpanded = true;
    },
    closeMeeting: (state) => {
      state.link = null;
      state.isOpen = false;
      state.isMinimized = false;
      state.isExpanded = true;
    },
    minimizeMeeting: (state) => {
      state.isMinimized = true;
      state.isExpanded = false;
    },
    expandMeeting: (state) => {
      state.isExpanded = true;
      state.isMinimized = false;
    },
  },
});

export const { startMeeting, closeMeeting, minimizeMeeting, expandMeeting } = meetingSlice.actions;
export default meetingSlice.reducer;