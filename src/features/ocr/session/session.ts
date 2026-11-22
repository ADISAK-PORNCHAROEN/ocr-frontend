export type OcrSession = {
	jobId: string;
	selectedPage: number;
	drafts: Readonly<Record<number, string>>;
	revision: number;
	downloadedRevision: number;
};

export type SessionAction =
	| { type: "select-page"; pageNumber: number }
	| { type: "edit-page"; pageNumber: number; text: string }
	| { type: "restore-page"; pageNumber: number }
	| { type: "export-downloaded"; revision: number };

export function createInitialSession(jobId: string): OcrSession {
	return {
		jobId,
		selectedPage: 1,
		drafts: {},
		revision: 0,
		downloadedRevision: 0,
	};
}

export function sessionReducer(state: OcrSession, action: SessionAction): OcrSession {
	switch (action.type) {
		case "select-page":
			return state.selectedPage === action.pageNumber
				? state
				: { ...state, selectedPage: action.pageNumber };
		case "edit-page":
			if (
				Object.hasOwn(state.drafts, action.pageNumber) &&
				state.drafts[action.pageNumber] === action.text
			) {
				return state;
			}
			return {
				...state,
				drafts: { ...state.drafts, [action.pageNumber]: action.text },
				revision: state.revision + 1,
			};
		case "restore-page": {
			if (!Object.hasOwn(state.drafts, action.pageNumber)) return state;
			const drafts = { ...state.drafts };
			delete drafts[action.pageNumber];
			return { ...state, drafts, revision: state.revision + 1 };
		}
		case "export-downloaded":
			return action.revision === state.downloadedRevision
				? state
				: { ...state, downloadedRevision: action.revision };
	}
}

export function hasUndownloadedEdits(session: OcrSession) {
	return session.revision !== session.downloadedRevision;
}

export function pageDraft(session: OcrSession, pageNumber: number, originalText: string) {
	return Object.hasOwn(session.drafts, pageNumber) ? session.drafts[pageNumber] : originalText;
}
