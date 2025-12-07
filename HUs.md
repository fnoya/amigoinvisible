📘 Documento de Historias de Usuario — Sistema Amigo Invisible

📌 Épica 1: Gestión de Participantes

HU 1.1 – Cargar participantes

Como organizador
Quiero poder cargar una lista de participantes con nombre y email
Para que el sistema pueda usarlos en el sorteo.

Criterios de aceptación
	•	Se puede cargar cada participante con:
	•	Nombre completo
	•	Dirección de email válida
	•	El sistema valida que no haya emails duplicados.
	•	Puedo agregar, editar o eliminar participantes antes del sorteo.

Definición de terminado
	•	Validaciones implementadas (campos obligatorios y formato email).
	•	Persistencia de la lista.
	•	Vista o API funcional.

⸻

HU 1.2 – Revisar lista de participantes

Como organizador
Quiero visualizar la lista completa de participantes
Para confirmar que todos están correctamente cargados.

Criterios de aceptación
	•	Se muestra un listado con:
	•	Nombre
	•	Email
	•	Permite eliminar o editar entradas.

DoD
	•	Listado accesible desde interfaz principal.

⸻

📌 Épica 2: Sorteo y Asignación

HU 2.1 – Ejecutar sorteo

Como organizador
Quiero ejecutar el sorteo de manera automática
Para obtener las asignaciones del amigo invisible.

Criterios de aceptación
	•	Ningún participante puede ser asignado a sí mismo.
	•	Cada persona debe recibir exactamente una asignación.
	•	El sorteo debe ser reproducible en caso de error, pero no debe repetirse accidentalmente.

DoD
	•	Algoritmo implementado y testeado:
	•	Sin auto-asignaciones.
	•	Sin asignaciones duplicadas.

⸻

HU 2.2 – Revisar resultado del sorteo

Como organizador
Quiero revisar el resultado del sorteo
Para asegurar que todo está en orden antes de enviar notificaciones.

Criterios de aceptación
	•	Se muestra la lista de pares (persona → destinatario).
	•	El sistema alerta si hay algún error (email inválido, asignación faltante).
	•	La vista solo está disponible para el organizador (no pública).

DoD
	•	Interfaz segura (autenticación mínima opcional).
	•	Vista clara de resultados.

⸻

📌 Épica 3: Envío de Notificaciones

HU 3.1 – Enviar emails de asignación

Como organizador
Quiero que el sistema envíe automáticamente un email a cada participante
Para notificarle quién es su amigo invisible.

Criterios de aceptación
	•	Cada participante recibe un email individual con:
	•	Su propio nombre (opcional).
	•	El nombre de la persona a la que debe regalarle.
	•	Fecha del evento (si se ingresó).
	•	El organizador no debe ver los destinatarios finales en copia (uso de BCC o envío individual).
	•	Logs del envío accesibles para el organizador.

DoD
	•	Integración con un servicio SMTP o proveedor (SendGrid, Amazon SES, etc.).
	•	Registro de:
	•	Email enviado
	•	Fecha/hora
	•	Estado (ok/error)

⸻

HU 3.2 – Ver estado del envío

Como organizador
Quiero ver un resumen del estado de envío
Para saber si hubo errores y reenviar correos si es necesario.

Criterios de aceptación
	•	Muestra lista de envíos con estado (enviado, error).
	•	Permite reenviar emails fallidos.

DoD
	•	Logs persistentes.
	•	Botón de reenvío operativo.

⸻

📌 Épica 4: Configuración del Evento

HU 4.1 – Configurar datos del evento

Como organizador
Quiero configurar la información del evento
Para que se incluya en las notificaciones del sorteo.

Criterios de aceptación
	•	Campos opcionales:
	•	Nombre del evento
	•	Fecha del intercambio
	•	Monto sugerido del regalo
	•	Mensaje personalizado
	•	Los datos aparecen correctamente en el email.

DoD
	•	Configuración guardada y reusable.

⸻

📌 Épica 5: Seguridad y Privacidad

HU 5.1 – Proteger información

Como organizador o participante
Quiero que mi información personal esté resguardada
Para garantizar privacidad y uso seguro.

Criterios de aceptación
	•	Emails solo visibles al organizador.
	•	Las asignaciones no se revelan públicamente.
	•	No se guardan más datos personales que los necesarios.
	•	Acceso restringido al administrador para ver resultados.

DoD
	•	Datos en tránsito protegidos (HTTPS si es web).
	•	Acceso a panel protegido por contraseña simple (si aplica).

⸻

📌 (Opcional) Épica 6: Experiencia de Usuario

HU 6.1 – Interfaz simple

Como organizador
Quiero una interfaz clara y fácil
Para realizar el sorteo sin conocimientos técnicos.

Criterios de aceptación
	•	Flujo paso a paso:
	1.	Cargar participantes
	2.	Revisar lista
	3.	Configurar evento
	4.	Ejecutar sorteo
	5.	Enviar emails
	•	Mensajes claros de error y confirmación.

DoD
	•	Flujo implementado y testeado con usuarios.

⸻

📌 (Opcional) Épica 7: Exportación e Integración

HU 7.1 – Exportar asignaciones

Como organizador
Quiero poder exportar las asignaciones en un archivo seguro
Para tener un respaldo.

Criterios de aceptación
	•	Exportación en formato CSV o PDF.
	•	El archivo no incluye emails de los demás participantes (solo organizador).


