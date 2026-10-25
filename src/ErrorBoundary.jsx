import { Component } from "react";
import { reportError } from "./errorReporter";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    reportError(error);
  }

  render() {
    if (this.state.error) {
      return <p role="alert">Something went wrong: {this.state.error.message}</p>;
    }
    return this.props.children;
  }
}
