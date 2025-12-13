/*
 * Export reusable style objects for the Calendar component. By moving
 * these styles into their own module, the layout definitions become
 * separate from the component logic. These styles ensure that the
 * calendar fills the entire viewport with a white background and
 * appropriate padding.
 */

export const pageStyle = {
  margin: 0,
  padding: 0,
  backgroundColor: '#ffffff',
  // Force the container to occupy the entire viewport. This prevents
  // unexpected layout constraints from parent components or global styles.
  height: '100vh',
  width: '100vw',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
};

export const containerStyle = {
  width: '100%',
  padding: '20px',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
  // Allow the calendar container to grow within the flex layout. The
  // height of the parent is set in pageStyle above.
  flex: 1,
  height: '100%',
};