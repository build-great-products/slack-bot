type Note = {
  id: string
  status: string
  title: string
  contentId: string
  referenceId?: string
  customerId?: string
  lastModifiedByUserId: string
  lastModifiedAt: number
}

type User = {
  id: string
  email: string
  name?: string
  image?: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  isDemoAccount: boolean
}

type Workspace = {
  id: string
  publicId: string
  name: string
  icp: string
  strategy: string
  vision: string
  icon: string
}

type Reference = {
  id: string
  name: string
  url: string
}

type Customer = {
  id: string
  name: string
}

export type { Note, User, Workspace, Reference, Customer }
