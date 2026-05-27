import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[memory-brain] render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#03020a] px-8 text-center">
          <p className="font-body mb-2 text-[10px] tracking-[0.4em] text-violet-300/40 uppercase">
            consciousness interrupted
          </p>
          <h1 className="font-display mb-4 text-2xl font-light italic text-violet-50/90">
            Something drifted out of reach
          </h1>
          <p className="font-body mb-8 max-w-md text-sm text-violet-200/45">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="font-body rounded-full border border-violet-200/25 px-8 py-2.5 text-[10px] tracking-[0.35em] text-violet-100/70 uppercase transition-colors hover:border-violet-200/40"
          >
            return to surface
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
