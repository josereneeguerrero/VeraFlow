import { create } from 'zustand';

interface OnboardingState {
  step: number;
  workspaceName: string;
  organizationDetails: {
    industry: string;
    teamSize: string;
    location: string;
  };
  teamType: string;
  goals: string[];
  assessmentResponses: Record<string, string>;
  setStep: (step: number) => void;
  setWorkspaceName: (name: string) => void;
  setOrganizationDetails: (details: Partial<OnboardingState['organizationDetails']>) => void;
  setTeamType: (type: string) => void;
  setGoals: (goals: string[]) => void;
  setAssessmentResponse: (questionId: string, answer: string) => void;
  reset: () => void;
}

const initialOnboardingState = {
  step: 0,
  workspaceName: '',
  organizationDetails: {
    industry: '',
    teamSize: '',
    location: '',
  },
  teamType: '',
  goals: [],
  assessmentResponses: {},
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialOnboardingState,
  setStep: (step) => set({ step }),
  setWorkspaceName: (workspaceName) => set({ workspaceName }),
  setOrganizationDetails: (details) =>
    set((state) => ({
      organizationDetails: { ...state.organizationDetails, ...details },
    })),
  setTeamType: (teamType) => set({ teamType }),
  setGoals: (goals) => set({ goals }),
  setAssessmentResponse: (questionId, answer) =>
    set((state) => ({
      assessmentResponses: { ...state.assessmentResponses, [questionId]: answer },
    })),
  reset: () => set(initialOnboardingState),
}));

interface AppState {
  isLoading: boolean;
  currentWorkspaceId: string | null;
  setIsLoading: (loading: boolean) => void;
  setCurrentWorkspaceId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  currentWorkspaceId: null,
  setIsLoading: (isLoading) => set({ isLoading }),
  setCurrentWorkspaceId: (currentWorkspaceId) => set({ currentWorkspaceId }),
}));
