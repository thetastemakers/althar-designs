import { ProjectRules as Rules } from '@charrette/ui'

/* Project rules: how much a project's agents ask you, decided once. From
   @charrette/ui; the "always ask me" list is the project's own. */
const ALWAYS = [
  { id: 'prod', label: 'Deploys, and anything that reaches production' },
  { id: 'staging', label: 'Commands that reach staging' },
  { id: 'main', label: 'Pushing to main' },
  { id: 'spend', label: 'Spending more than $5 on one task' },
  { id: 'outside', label: 'Deleting files outside the task’s workspace' },
  { id: 'people', label: 'Messages to people: email, Slack, issue comments' },
]
const ON = ['prod', 'staging', 'main', 'spend', 'outside']

export function ProjectRules() {
  return <Rules project="Meridian" always={ALWAYS} defaultAlwaysOn={ON} learned="6 of 10 so far" onAddRule={() => {}} />
}
