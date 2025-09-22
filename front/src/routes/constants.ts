export enum Path {
  unauth = '/',
  menu = '/menu',
  questionList = '/questions',
  questionForm = '/question-form/:questionId?',
  teacherList = '/teacher-list',
  teacherForm = '/teacher-form/:id?',
  studentList = '/student-list',
  studentForm = '/student-form/:id?',
  register = '/register',
  resetPassword = '/reset-password',       
  setPassword = '/definir-senha/:token' ,  
  ranking = '/ranking',
  logs ='/logs',
  colecionaveis ='/colecionaveis'
}
